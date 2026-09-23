import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
from typing import Dict, List, Tuple, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

GPS_THRESHOLDS = {
    'strong': 10,
    'acceptable': 30,
    'weak': 50
}

SCORING_WEIGHTS = {
    'gps': 30,
    'viewpoint': 20,
    'landmark': 20,
    'road_scene': 20,
    'pothole': 10
}

DECISION_THRESHOLDS = {
    'verified': 80,
    'manual_review': 60
}

try:
    SIFT = cv2.SIFT_create()
    USE_SIFT = True
    logger.info("SIFT available")
except:
    ORB = cv2.ORB_create(nfeatures=2000)
    USE_SIFT = False
    logger.info("SIFT not available, using ORB")

FLANN_INDEX_KDTREE = 1
FLANN_INDEX_LSH = 6

if USE_SIFT:
    FLANN_PARAMS = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
else:
    FLANN_PARAMS = dict(algorithm=FLANN_INDEX_LSH, table_number=6, key_size=12, multi_probe_level=1)

FLANN_MATCHER = cv2.FlannBasedMatcher(FLANN_PARAMS, dict(checks=50))

def load_image(image_path: str) -> Optional[np.ndarray]:
    if not os.path.exists(image_path):
        logger.error(f"Image not found: {image_path}")
        return None
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Failed to load image: {image_path}")
        return None
    return img

def calculate_gps_score(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[int, float]:
    R = 6371000
    φ1 = np.radians(lat1)
    φ2 = np.radians(lat2)
    Δφ = np.radians(lat2 - lat1)
    Δλ = np.radians(lon2 - lon1)

    a = np.sin(Δφ/2)**2 + np.cos(φ1) * np.cos(φ2) * np.sin(Δλ/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    distance = R * c

    if distance <= GPS_THRESHOLDS['strong']:
        score = 30
    elif distance <= GPS_THRESHOLDS['acceptable']:
        score = 25 - int((distance - GPS_THRESHOLDS['strong']) / (GPS_THRESHOLDS['acceptable'] - GPS_THRESHOLDS['strong']) * 10)
    elif distance <= GPS_THRESHOLDS['weak']:
        score = 15 - int((distance - GPS_THRESHOLDS['acceptable']) / (GPS_THRESHOLDS['weak'] - GPS_THRESHOLDS['acceptable']) * 10)
    else:
        score = max(0, 10 - int((distance - GPS_THRESHOLDS['weak']) / 100))

    return max(0, min(30, score)), float(distance)

def extract_features(image: np.ndarray) -> Tuple[List, np.ndarray]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if USE_SIFT:
        kp, des = SIFT.detectAndCompute(gray, None)
    else:
        kp, des = ORB.detectAndCompute(gray, None)
    return kp, des

def match_features(des1: np.ndarray, des2: np.ndarray) -> List:
    if des1 is None or des2 is None or len(des1) < 2 or len(des2) < 2:
        return []
    
    try:
        matches = FLANN_MATCHER.knnMatch(des1, des2, k=2)
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)
        return good_matches
    except Exception as e:
        logger.warning(f"Feature matching failed: {e}")
        return []

def calculate_homography(kp1: List, kp2: List, matches: List) -> Tuple[Optional[np.ndarray], float]:
    if len(matches) < 10:
        return None, 0.0
    
    src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    
    try:
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        inlier_ratio = np.sum(mask) / len(mask) if mask is not None else 0
        return H, float(inlier_ratio)
    except Exception as e:
        logger.warning(f"Homography calculation failed: {e}")
        return None, 0.0

def calculate_viewpoint_score(kp1: List, kp2: List, matches: List, H: Optional[np.ndarray], inlier_ratio: float) -> int:
    if len(matches) < 10:
        return 5
    
    score = min(20, int(len(matches) / 50 * 15) + int(inlier_ratio * 10))
    return min(20, max(0, score))

def calculate_landmark_score(kp1: List, kp2: List, matches: List, img1_shape: Tuple, img2_shape: Tuple) -> int:
    if len(matches) < 10:
        return 5
    
    h1, w1 = img1_shape[:2]
    h2, w2 = img2_shape[:2]
    
    match_positions_1 = np.array([kp1[m.queryIdx].pt for m in matches])
    match_positions_2 = np.array([kp2[m.trainIdx].pt for m in matches])
    
    upper_matches_1 = match_positions_1[match_positions_1[:, 1] < h1 * 0.6]
    upper_matches_2 = match_positions_2[match_positions_2[:, 1] < h2 * 0.6]
    
    upper_ratio = min(len(upper_matches_1), len(upper_matches_2)) / max(len(matches), 1)
    
    score = int(upper_ratio * 20)
    return min(20, max(0, score))

def calculate_road_scene_score(kp1: List, kp2: List, matches: List, img1_shape: Tuple, img2_shape: Tuple) -> int:
    if len(matches) < 10:
        return 5
    
    h1, w1 = img1_shape[:2]
    h2, w2 = img2_shape[:2]
    
    match_positions_1 = np.array([kp1[m.queryIdx].pt for m in matches])
    match_positions_2 = np.array([kp2[m.trainIdx].pt for m in matches])
    
    lower_matches_1 = match_positions_1[match_positions_1[:, 1] > h1 * 0.4]
    lower_matches_2 = match_positions_2[match_positions_2[:, 1] > h2 * 0.4]
    
    lower_ratio = min(len(lower_matches_1), len(lower_matches_2)) / max(len(matches), 1)
    
    horizontal_spread_1 = np.std(match_positions_1[:, 0]) / w1 if len(match_positions_1) > 1 else 0
    horizontal_spread_2 = np.std(match_positions_2[:, 0]) / w2 if len(match_positions_2) > 1 else 0
    spread_similarity = 1 - abs(horizontal_spread_1 - horizontal_spread_2)
    
    score = int((lower_ratio * 0.7 + spread_similarity * 0.3) * 20)
    return min(20, max(0, score))

def calculate_pothole_score(img1: np.ndarray, img2: np.ndarray, kp1: List, kp2: List, matches: List, H: Optional[np.ndarray]) -> int:
    if H is None or len(matches) < 20:
        return 3
    
    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]
    
    corners = np.float32([[0, 0], [w1, 0], [w1, h1], [0, h1]]).reshape(-1, 1, 2)
    
    try:
        warped_corners = cv2.perspectiveTransform(corners, H)
        
        x_coords = warped_corners[:, 0, 0]
        y_coords = warped_corners[:, 0, 1]
        
        overlap_x = max(0, min(w2, max(x_coords)) - max(0, min(x_coords)))
        overlap_y = max(0, min(h2, max(y_coords)) - max(0, min(y_coords)))
        overlap_area = overlap_x * overlap_y
        total_area = w2 * h2
        overlap_ratio = overlap_area / total_area if total_area > 0 else 0
        
        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
        
        warped_img1 = cv2.warpPerspective(gray1, H, (w2, h2))
        
        diff = cv2.absdiff(warped_img1, gray2)
        _, diff_thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        change_ratio = np.sum(diff_thresh > 0) / (w2 * h2)
        
        expected_change = 0.15
        change_score = max(0, 1 - abs(change_ratio - expected_change) / expected_change)
        
        score = int((overlap_ratio * 0.5 + change_score * 0.5) * 10)
        return min(10, max(0, score))
    except Exception as e:
        logger.warning(f"Pothole score calculation failed: {e}")
        return 3

def verify_repair(original_path: str, repair_path: str, original_gps: Dict, repair_gps: Dict) -> Dict:
    start_time = time.time()
    
    img1 = load_image(original_path)
    img2 = load_image(repair_path)
    
    if img1 is None or img2 is None:
        raise ValueError("Failed to load one or both images")
    
    gps_score, distance = calculate_gps_score(
        original_gps['lat'], original_gps['lng'],
        repair_gps['lat'], repair_gps['lng']
    )
    
    kp1, des1 = extract_features(img1)
    kp2, des2 = extract_features(img2)
    
    matches = match_features(des1, des2)
    
    H, inlier_ratio = calculate_homography(kp1, kp2, matches)
    
    viewpoint_score = calculate_viewpoint_score(kp1, kp2, matches, H, inlier_ratio)
    landmark_score = calculate_landmark_score(kp1, kp2, matches, img1.shape, img2.shape)
    road_scene_score = calculate_road_scene_score(kp1, kp2, matches, img1.shape, img2.shape)
    pothole_score = calculate_pothole_score(img1, img2, kp1, kp2, matches, H)
    
    total_score = gps_score + viewpoint_score + landmark_score + road_scene_score + pothole_score
    
    if total_score >= DECISION_THRESHOLDS['verified']:
        decision = 'VERIFIED'
        confidence = 'HIGH'
    elif total_score >= DECISION_THRESHOLDS['manual_review']:
        decision = 'MANUAL_REVIEW'
        confidence = 'MEDIUM'
    else:
        decision = 'REJECTED'
        confidence = 'LOW' if total_score < 30 else 'MEDIUM'
    
    explanation = []
    explanation.append(f"GPS distance: {distance:.1f}m (score: {gps_score}/30)")
    explanation.append(f"Feature matches: {len(matches)} (inlier ratio: {inlier_ratio:.2f})")
    explanation.append(f"Viewpoint score: {viewpoint_score}/20")
    explanation.append(f"Background/landmark score: {landmark_score}/20")
    explanation.append(f"Road scene score: {road_scene_score}/20")
    explanation.append(f"Pothole region score: {pothole_score}/10")
    
    if decision == 'VERIFIED':
        explanation.append("All verification criteria met - repair confirmed at same location")
    elif decision == 'MANUAL_REVIEW':
        explanation.append("Some criteria met but uncertainty remains - manual review recommended")
    else:
        explanation.append("Significant mismatches detected - likely fraudulent or wrong location")
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return {
        'gpsScore': gps_score,
        'viewpointScore': viewpoint_score,
        'landmarkScore': landmark_score,
        'roadSceneScore': road_scene_score,
        'potholeScore': pothole_score,
        'totalScore': total_score,
        'decision': decision,
        'confidence': confidence,
        'distanceMeters': distance,
        'explanation': explanation,
        'processingTimeMs': processing_time,
        'fallbackMode': False
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'ai-verification',
        'version': '1.0.0',
        'sift_available': USE_SIFT
    })

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        
        required_fields = ['originalImage', 'repairImage', 'originalGPS', 'repairGPS']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        original_path = data['originalImage']
        repair_path = data['repairImage']
        original_gps = data['originalGPS']
        repair_gps = data['repairGPS']
        
        logger.info(f"Verifying: {original_path} vs {repair_path}")
        logger.info(f"GPS: {original_gps} -> {repair_gps}")
        
        result = verify_repair(original_path, repair_path, original_gps, repair_gps)
        
        logger.info(f"Result: {result['decision']} ({result['totalScore']}/100)")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)