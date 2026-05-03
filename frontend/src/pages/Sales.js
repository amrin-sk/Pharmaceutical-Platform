import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════
   LAYER 1 — Specific medicine keyword → curated suggestions
   Keys are fuzzy-matched (substring), not exact.
═══════════════════════════════════════════════════════════════ */
const KEYWORD_SUGGESTIONS = [
  {
    keywords: ['paracetamol', 'calpol', 'crocin', 'metacin'],
    group: 'Fever & Pain Relief', icon: '🌡️',
    items: [
      { name: 'Ibuprofen',        use: 'Stronger anti-inflammatory pain relief' },
      { name: 'Combiflam',        use: 'Paracetamol + Ibuprofen ready-made combo' },
      { name: 'Cold & Flu Tablet',use: 'Relieves cold symptoms accompanying fever' },
      { name: 'Vitamin C 500mg',  use: 'Boosts immunity while fighting fever' },
      { name: 'ORS Sachet',       use: 'Prevents dehydration during high fever' },
      { name: 'Cetirizine',       use: 'Controls runny nose & sneezing with fever' },
    ],
  },
  {
    keywords: ['dolo'],
    group: 'Fever & Pain Relief', icon: '🌡️',
    items: [
      { name: 'Ibuprofen',        use: 'Added anti-inflammatory for stronger relief' },
      { name: 'Cetirizine',       use: 'Cold-related allergy & congestion control' },
      { name: 'Vitamin C 500mg',  use: 'Immune support during fever' },
      { name: 'ORS Sachet',       use: 'Rehydration during fever episodes' },
      { name: 'Cold & Flu Tablet',use: 'Complete cold & fever combo coverage' },
    ],
  },
  {
    keywords: ['ibuprofen', 'brufen', 'combiflam'],
    group: 'Anti-inflammatory / Pain', icon: '💪',
    items: [
      { name: 'Paracetamol',      use: 'Alternated for around-the-clock fever control' },
      { name: 'Omeprazole',       use: 'Essential stomach protection with NSAIDs' },
      { name: 'Pantoprazole',     use: 'Prevents NSAID-induced gastric ulcers' },
      { name: 'Diclofenac Gel',   use: 'Topical pain relief for joints & muscles' },
      { name: 'Muscle Relaxant',  use: 'Relieves muscle spasm alongside ibuprofen' },
    ],
  },
  {
    keywords: ['aspirin', 'ecosprin', 'disprin'],
    group: 'Blood Thinner / Cardiac', icon: '❤️',
    items: [
      { name: 'Clopidogrel',      use: 'Dual antiplatelet therapy for heart patients' },
      { name: 'Atorvastatin',     use: 'Cholesterol control — routinely co-prescribed' },
      { name: 'Ramipril',         use: 'Blood pressure & kidney protection' },
      { name: 'Omeprazole',       use: 'Stomach protection with long-term aspirin use' },
      { name: 'Vitamin B12',      use: 'Prevents aspirin-induced B12 depletion' },
    ],
  },
  {
    keywords: ['amoxicil', 'amoxil', 'amox'],
    group: 'Antibiotic', icon: '🦠',
    items: [
      { name: 'Probiotics',       use: 'Restores gut flora depleted by antibiotics' },
      { name: 'Paracetamol',      use: 'Controls infection-related fever' },
      { name: 'Cetirizine',       use: 'Allergy prevention during antibiotic use' },
      { name: 'ORS Sachet',       use: 'Manages antibiotic-induced loose motions' },
      { name: 'Vitamin C',        use: 'Accelerates immune recovery post-infection' },
    ],
  },
  {
    keywords: ['azithromycin', 'azithral', 'zithromax', 'azee'],
    group: 'Antibiotic', icon: '🦠',
    items: [
      { name: 'Probiotics',       use: 'Critical gut flora restoration post-course' },
      { name: 'Paracetamol',      use: 'Fever management during infection' },
      { name: 'Cetirizine',       use: 'Respiratory allergy symptom control' },
      { name: 'Zinc Tablet',      use: 'Proven to reduce infection duration' },
      { name: 'Multivitamin',     use: 'Supports full recovery after infection' },
    ],
  },
  {
    keywords: ['ciprofloxacin', 'cipro', 'ciplox', 'cifran'],
    group: 'Antibiotic (Broad Spectrum)', icon: '🦠',
    items: [
      { name: 'Probiotics',       use: 'Essential during fluoroquinolone therapy' },
      { name: 'ORS Sachet',       use: 'Manages GI side effects like diarrhoea' },
      { name: 'Metronidazole',    use: 'Often paired for mixed GI infections' },
      { name: 'Paracetamol',      use: 'Fever and body ache relief' },
      { name: 'Vitamin C',        use: 'Immune support during treatment' },
    ],
  },
  {
    keywords: ['doxycycline', 'doxt', 'vibramycin'],
    group: 'Antibiotic', icon: '🦠',
    items: [
      { name: 'Probiotics',       use: 'Restores gut flora after tetracycline use' },
      { name: 'Antacid Syrup',    use: 'Prevents doxycycline-related GI irritation' },
      { name: 'Paracetamol',      use: 'Manages infection fever and headache' },
      { name: 'Vitamin D3',       use: 'Doxycycline can reduce vitamin D levels' },
    ],
  },
  {
    keywords: ['cetirizine', 'cetzine', 'zyrtec', 'alerid'],
    group: 'Antihistamine / Allergy', icon: '🌸',
    items: [
      { name: 'Montelukast',         use: 'Combined therapy for allergic rhinitis & asthma' },
      { name: 'Fluticasone Nasal Spray', use: 'Topical steroid for nasal allergy' },
      { name: 'Antihistamine Eye Drops',  use: 'For allergic conjunctivitis' },
      { name: 'Vitamin D3',          use: 'Low Vitamin D linked to increased allergies' },
      { name: 'Salbutamol Inhaler',  use: 'If allergy causes breathing difficulty' },
    ],
  },
  {
    keywords: ['loratadine', 'lorfast', 'clarityne', 'fexofenadine', 'allegra'],
    group: 'Antihistamine / Allergy', icon: '🌸',
    items: [
      { name: 'Montelukast',             use: 'Leukotriene blocker for allergy-asthma' },
      { name: 'Nasal Decongestant Spray',use: 'Rapid nasal congestion relief' },
      { name: 'Fluticasone Nasal Spray', use: 'Long-term nasal allergy control' },
      { name: 'Vitamin C',               use: 'Natural antihistamine synergy' },
    ],
  },
  {
    keywords: ['omeprazole', 'omez', 'prilosec'],
    group: 'Antacid / GI', icon: '🫁',
    items: [
      { name: 'Domperidone',      use: 'Reduces nausea & helps gastric motility' },
      { name: 'Antacid Syrup',    use: 'Quick relief between PPI doses' },
      { name: 'Metronidazole',    use: 'H. pylori eradication triple therapy' },
      { name: 'Amoxicillin',      use: 'Part of H. pylori treatment protocol' },
      { name: 'Probiotic',        use: 'Restores gut flora during PPI therapy' },
    ],
  },
  {
    keywords: ['pantoprazole', 'pan', 'pantocid', 'pantop'],
    group: 'Antacid / GI', icon: '🫁',
    items: [
      { name: 'Domperidone',      use: 'Motility agent for gastric reflux' },
      { name: 'Antacid Tablet',   use: 'Immediate symptomatic relief' },
      { name: 'Sucralfate',       use: 'Mucosal protection for peptic ulcers' },
      { name: 'Probiotic',        use: 'Gut health maintenance on PPIs' },
    ],
  },
  {
    keywords: ['ranitidine', 'rantac', 'zantac'],
    group: 'Antacid / H2 Blocker', icon: '🫁',
    items: [
      { name: 'Antacid Gel',      use: 'Instant acid neutralisation relief' },
      { name: 'Domperidone',      use: 'Reduces nausea alongside H2 blocker' },
      { name: 'Probiotic',        use: 'Supports gut health during therapy' },
      { name: 'Omeprazole',       use: 'Upgrade to PPI for stronger acid control' },
    ],
  },
  {
    keywords: ['metformin', 'glucophage', 'glycomet'],
    group: 'Diabetes', icon: '🩸',
    items: [
      { name: 'Vitamin B12',      use: 'Metformin depletes B12 — mandatory supplement' },
      { name: 'Glipizide',        use: 'Add-on oral hypoglycaemic agent' },
      { name: 'Atorvastatin',     use: 'Cholesterol control — common in T2DM' },
      { name: 'Ramipril',         use: 'Kidney & cardiovascular protection in DM' },
      { name: 'Aspirin 75mg',     use: 'Cardiovascular risk prevention in diabetics' },
    ],
  },
  {
    keywords: ['glipizide', 'glimepiride', 'amaryl', 'glimpid'],
    group: 'Diabetes', icon: '🩸',
    items: [
      { name: 'Metformin',        use: 'First-line diabetes drug — often combined' },
      { name: 'Glucose Tablets',  use: 'For managing hypoglycaemia emergencies' },
      { name: 'Atorvastatin',     use: 'Reduces cardiovascular risk in diabetics' },
      { name: 'Vitamin B12',      use: 'Prevents diabetic neuropathy' },
    ],
  },
  {
    keywords: ['insulin'],
    group: 'Diabetes (Insulin)', icon: '🩸',
    items: [
      { name: 'Glucose Gel',      use: 'Emergency hypoglycaemia treatment' },
      { name: 'Metformin',        use: 'Often combined with basal insulin' },
      { name: 'Vitamin D3',       use: 'Improves insulin sensitivity' },
      { name: 'Zinc Tablet',      use: 'Essential for insulin synthesis & storage' },
      { name: 'Omega-3 Fish Oil', use: 'Reduces triglycerides common in T2DM' },
    ],
  },
  {
    keywords: ['amlodipine', 'amlip', 'amlong', 'norvasc'],
    group: 'Blood Pressure', icon: '💓',
    items: [
      { name: 'Telmisartan',      use: 'ARB combined for superior BP control' },
      { name: 'Atorvastatin',     use: 'Statin — standard in hypertension patients' },
      { name: 'Aspirin 75mg',     use: 'Cardiovascular event prevention' },
      { name: 'Potassium Supplement', use: 'Electrolyte balance in hypertension' },
      { name: 'Ramipril',         use: 'ACE inhibitor for heart & kidney protection' },
    ],
  },
  {
    keywords: ['telmisartan', 'telma', 'telmikind', 'losartan', 'covance'],
    group: 'Blood Pressure (ARB)', icon: '💓',
    items: [
      { name: 'Amlodipine',             use: 'Calcium channel blocker combination therapy' },
      { name: 'Atorvastatin',           use: 'Lipid-lowering — common in hypertensives' },
      { name: 'Aspirin 75mg',           use: 'Antiplatelet for cardiovascular risk' },
      { name: 'Hydrochlorothiazide',    use: 'Diuretic for resistant hypertension' },
    ],
  },
  {
    keywords: ['atenolol', 'ramipril', 'lisinopril', 'enalapril'],
    group: 'Blood Pressure (ACE/Beta)', icon: '💓',
    items: [
      { name: 'Aspirin 75mg',     use: 'Antiplatelet cardiovascular protection' },
      { name: 'Atorvastatin',     use: 'Cholesterol management in cardiac patients' },
      { name: 'Amlodipine',       use: 'Combined antihypertensive therapy' },
      { name: 'Potassium Supplement', use: 'Replenish potassium if on ACE inhibitors' },
    ],
  },
  {
    keywords: ['atorvastatin', 'atorva', 'lipitor', 'rosuvastatin', 'crestor', 'rosvast'],
    group: 'Cholesterol', icon: '🫀',
    items: [
      { name: 'Aspirin 75mg',     use: 'Cardiovascular event prevention' },
      { name: 'Ezetimibe',        use: 'Additional LDL cholesterol lowering' },
      { name: 'CoQ10 100mg',      use: 'Statins deplete CoQ10 — essential supplement' },
      { name: 'Omega-3 Fish Oil', use: 'Triglyceride reduction' },
      { name: 'Ramipril',         use: 'ACE inhibitor — common in cardiac patients' },
    ],
  },
  {
    keywords: ['clopidogrel', 'plavix', 'clopilet'],
    group: 'Antiplatelet / Cardiac', icon: '🫀',
    items: [
      { name: 'Aspirin 75mg',     use: 'Standard dual antiplatelet combination' },
      { name: 'Atorvastatin',     use: 'Cholesterol — co-prescribed in ACS patients' },
      { name: 'Omeprazole',       use: 'GI protection with dual antiplatelet therapy' },
      { name: 'Ramipril',         use: 'Post-MI heart protection' },
    ],
  },
  {
    keywords: ['cetirizine', 'sinarest', 'cheston', 'cold', 'flu', 'vicks', 'cofsils'],
    group: 'Cold & Flu', icon: '🤧',
    items: [
      { name: 'Paracetamol',           use: 'Controls fever and body aches' },
      { name: 'Cetirizine',            use: 'Dries up runny nose and sneezing' },
      { name: 'Vitamin C 500mg',       use: 'Clinically proven to shorten cold duration' },
      { name: 'Zinc Tablet',           use: 'Reduces cold intensity and frequency' },
      { name: 'Steam Inhalation Drops',use: 'Clears blocked nasal passages instantly' },
    ],
  },
  {
    keywords: ['cough', 'tusq', 'benylin', 'corex', 'phensedyl', 'alex', 'ascoril'],
    group: 'Cough Syrup', icon: '😮‍💨',
    items: [
      { name: 'Cetirizine',       use: 'Controls post-nasal drip causing cough' },
      { name: 'Paracetamol',      use: 'Manages fever accompanying cough' },
      { name: 'Guaifenesin',      use: 'Expectorant to loosen and clear mucus' },
      { name: 'Salbutamol Inhaler', use: 'If cough has bronchospasm component' },
      { name: 'Throat Lozenge',   use: 'Instant soothing relief for sore throat' },
    ],
  },
  {
    keywords: ['vitamin', 'multivitamin', 'supradyn', 'becosule', 'neurobion'],
    group: 'Vitamins & Supplements', icon: '💊',
    items: [
      { name: 'Zinc Tablet',      use: 'Enhances immunity synergistically with vitamins' },
      { name: 'Calcium + D3',     use: 'Bone health — best taken with multivitamins' },
      { name: 'Iron + Folic Acid',use: 'Anaemia prevention and correction' },
      { name: 'Omega-3 Fish Oil', use: 'Heart, brain, and joint health benefits' },
      { name: 'Probiotic',        use: 'Gut health to maximise nutrient absorption' },
    ],
  },
  {
    keywords: ['calcium', 'shelcal', 'calcimax', 'caltrate'],
    group: 'Calcium & Bone Health', icon: '🦴',
    items: [
      { name: 'Vitamin D3',       use: 'Essential for calcium absorption into bones' },
      { name: 'Magnesium',        use: 'Works with calcium for muscle & bone health' },
      { name: 'Vitamin K2',       use: 'Directs calcium to bones, not arteries' },
      { name: 'Vitamin C',        use: 'Collagen synthesis for bone matrix' },
    ],
  },
  {
    keywords: ['zinc', 'zincovit', 'zinconia'],
    group: 'Immunity / Supplements', icon: '🛡️',
    items: [
      { name: 'Vitamin C 500mg',  use: 'Synergistic immunity boost with zinc' },
      { name: 'Vitamin D3',       use: 'Immune modulation alongside zinc' },
      { name: 'Multivitamin',     use: 'Complete micronutrient support' },
      { name: 'Probiotics',       use: 'Gut-immunity axis support' },
    ],
  },
  {
    keywords: ['salbutamol', 'levolin', 'ventolin', 'asthalin'],
    group: 'Respiratory / Asthma', icon: '🫁',
    items: [
      { name: 'Budesonide Inhaler', use: 'Inhaled steroid for long-term asthma control' },
      { name: 'Montelukast',        use: 'Leukotriene antagonist — add-on therapy' },
      { name: 'Ipratropium Inhaler',use: 'Combined bronchodilator for COPD' },
      { name: 'Prednisolone',       use: 'Oral steroid for acute asthma attacks' },
      { name: 'Cetirizine',         use: 'For allergic trigger component of asthma' },
    ],
  },
  {
    keywords: ['montelukast', 'montair', 'singulair'],
    group: 'Respiratory / Allergy', icon: '🌬️',
    items: [
      { name: 'Cetirizine',           use: 'Combined first-line for allergic rhinitis' },
      { name: 'Fluticasone Nasal Spray', use: 'Topical nasal corticosteroid' },
      { name: 'Salbutamol Inhaler',   use: 'Rescue bronchodilator for asthma' },
      { name: 'Budesonide Inhaler',   use: 'Long-term inhaled steroid control' },
    ],
  },
  {
    keywords: ['metronidazole', 'flagyl', 'metrogyl'],
    group: 'Antibiotic / Antiprotozoal', icon: '🦠',
    items: [
      { name: 'Probiotics',       use: 'Gut flora replenishment after metronidazole' },
      { name: 'ORS Sachet',       use: 'Rehydration for infection-related diarrhoea' },
      { name: 'Omeprazole',       use: 'Stomach protection during GI treatment' },
      { name: 'Ciprofloxacin',    use: 'Combined broad-spectrum coverage' },
    ],
  },
  {
    keywords: ['diclofenac', 'voveran', 'voltaren', 'diclogesic'],
    group: 'Anti-inflammatory', icon: '💪',
    items: [
      { name: 'Omeprazole',       use: 'Mandatory stomach protection with diclofenac' },
      { name: 'Paracetamol',      use: 'Alternated for safer long-term pain control' },
      { name: 'Muscle Relaxant',  use: 'For musculoskeletal pain & spasm' },
      { name: 'Calcium + D3',     use: 'Bone support in joint pain conditions' },
    ],
  },
  {
    keywords: ['ondansetron', 'emeset', 'zofran', 'domperidone', 'domstal', 'perinorm'],
    group: 'Anti-nausea / GI Motility', icon: '🤢',
    items: [
      { name: 'ORS Sachet',       use: 'Rehydration after vomiting episodes' },
      { name: 'Omeprazole',       use: 'Acid suppression alongside anti-emetics' },
      { name: 'Electrolyte Drink',use: 'Restores lost electrolytes from vomiting' },
      { name: 'Probiotic',        use: 'Gut recovery after nausea/vomiting illness' },
    ],
  },
  {
    keywords: ['prednisolone', 'wysolone', 'prednisone', 'deflazacort'],
    group: 'Corticosteroid', icon: '⚡',
    items: [
      { name: 'Pantoprazole',     use: 'Essential stomach protection with steroids' },
      { name: 'Calcium + D3',     use: 'Steroids deplete calcium — replace daily' },
      { name: 'Potassium Supplement', use: 'Steroids cause potassium loss' },
      { name: 'Antifungal',       use: 'Steroids increase oral/systemic fungal risk' },
    ],
  },
  {
    keywords: ['vitamin b12', 'b12', 'methylcobalamin', 'cobalamin', 'mecobalamin'],
    group: 'Vitamin B12 / Neuropathy', icon: '🧠',
    items: [
      { name: 'Folic Acid',       use: 'B12 and folate work together for neurological health' },
      { name: 'Vitamin D3',       use: 'Commonly deficient alongside B12' },
      { name: 'Iron Tablet',      use: 'Anaemia often co-exists with B12 deficiency' },
      { name: 'Alpha Lipoic Acid',use: 'Neuroprotective supplement for nerve damage' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   LAYER 2 — Category-based fallback suggestions
   Matches the `category` field stored in your database.
═══════════════════════════════════════════════════════════════ */
const CATEGORY_SUGGESTIONS = {
  'antibiotic':         { group: 'Antibiotic', icon: '🦠', items: [
    { name: 'Probiotics',   use: 'Restores gut bacteria lost during antibiotic therapy' },
    { name: 'ORS Sachet',   use: 'Manages antibiotic-related loose motions' },
    { name: 'Paracetamol',  use: 'Controls infection-related fever and pain' },
    { name: 'Vitamin C',    use: 'Boosts immune recovery post-infection' },
    { name: 'Cetirizine',   use: 'Prevents antibiotic-related allergic reactions' },
  ]},
  'pain':               { group: 'Pain Relief', icon: '💊', items: [
    { name: 'Omeprazole',   use: 'Protects stomach lining during pain medication' },
    { name: 'Muscle Relaxant', use: 'Targets muscle spasm alongside pain killers' },
    { name: 'Vitamin B12',  use: 'Nerve health support in chronic pain' },
    { name: 'Calcium + D3', use: 'Bone & joint fortification' },
  ]},
  'antacid':            { group: 'Antacid / GI', icon: '🫁', items: [
    { name: 'Domperidone',  use: 'Improves gastric motility and reduces nausea' },
    { name: 'Probiotic',    use: 'Restores healthy gut flora' },
    { name: 'Sucralfate',   use: 'Mucosal barrier protection' },
  ]},
  'diabetes':           { group: 'Diabetes', icon: '🩸', items: [
    { name: 'Vitamin B12',  use: 'Prevents diabetic neuropathy' },
    { name: 'Atorvastatin', use: 'Cardiovascular risk reduction in diabetics' },
    { name: 'Aspirin 75mg', use: 'Heart attack & stroke prevention in DM' },
    { name: 'Vitamin D3',   use: 'Improves insulin sensitivity' },
  ]},
  'hypertension':       { group: 'Blood Pressure', icon: '💓', items: [
    { name: 'Atorvastatin', use: 'Lipid control — co-prescribed in hypertension' },
    { name: 'Aspirin 75mg', use: 'Cardiovascular protection' },
    { name: 'Potassium',    use: 'Electrolyte balance with antihypertensives' },
  ]},
  'cardiac':            { group: 'Cardiac', icon: '🫀', items: [
    { name: 'Aspirin 75mg', use: 'Antiplatelet — standard cardiac care' },
    { name: 'Atorvastatin', use: 'Cholesterol management for heart health' },
    { name: 'Omeprazole',   use: 'GI protection with aspirin/antiplatelet therapy' },
    { name: 'CoQ10',        use: 'Cardiac energy metabolism supplement' },
  ]},
  'respiratory':        { group: 'Respiratory', icon: '🌬️', items: [
    { name: 'Salbutamol Inhaler', use: 'Rescue bronchodilator for acute symptoms' },
    { name: 'Cetirizine',  use: 'Controls allergic component of respiratory issues' },
    { name: 'Montelukast', use: 'Long-term allergy & asthma control' },
    { name: 'Vitamin C',   use: 'Reduces respiratory infection frequency' },
  ]},
  'vitamin':            { group: 'Supplements', icon: '💊', items: [
    { name: 'Zinc Tablet',  use: 'Synergistic immunity boost' },
    { name: 'Probiotic',    use: 'Gut health to maximise absorption' },
    { name: 'Omega-3',      use: 'Heart and brain health supplement' },
  ]},
  'supplement':         { group: 'Supplements', icon: '💊', items: [
    { name: 'Vitamin C',    use: 'Antioxidant immune support' },
    { name: 'Zinc Tablet',  use: 'Immunity and wound healing' },
    { name: 'Probiotic',    use: 'Gut flora balance' },
  ]},
  'steroid':            { group: 'Corticosteroid', icon: '⚡', items: [
    { name: 'Pantoprazole', use: 'Mandatory stomach protection with steroids' },
    { name: 'Calcium + D3', use: 'Prevents steroid-induced bone loss' },
    { name: 'Potassium',    use: 'Replaces potassium lost through steroid use' },
  ]},
  'general':            { group: 'General Medicine', icon: '💊', items: [
    { name: 'Paracetamol',  use: 'Safe symptomatic fever & pain relief' },
    { name: 'Vitamin C',    use: 'Strengthens immune response' },
    { name: 'Zinc Tablet',  use: 'Essential mineral for immunity & healing' },
    { name: 'Probiotics',   use: 'Maintains gut health during any treatment' },
    { name: 'ORS Sachet',   use: 'Electrolyte replenishment and hydration' },
  ]},
};

/* ═══════════════════════════════════════════════════════════════
   LAYER 3 — Universal fallback (shown for ANY medicine)
═══════════════════════════════════════════════════════════════ */
const UNIVERSAL_FALLBACK = {
  group: 'General Health Support', icon: '🏥',
  items: [
    { name: 'Paracetamol 500mg', use: 'Universal fever & pain management' },
    { name: 'Vitamin C 500mg',   use: 'Boosts immunity during any illness or treatment' },
    { name: 'Zinc Tablet',       use: 'Supports immunity and faster recovery' },
    { name: 'Probiotics',        use: 'Maintains gut health during medication courses' },
    { name: 'ORS Sachet',        use: 'Hydration & electrolyte replenishment' },
    { name: 'Multivitamin',      use: 'Nutritional support during illness or treatment' },
  ],
};

/* ── Suggestion resolver ─────────────────────────────────────
   Priority: keyword match → category match → universal
──────────────────────────────────────────────────────────── */
function getSuggestions(medicineName, medicineCategory) {
  const nameLower = (medicineName || '').toLowerCase();
  const catLower  = (medicineCategory || '').toLowerCase();

  // Layer 1: fuzzy keyword match on name
  for (const entry of KEYWORD_SUGGESTIONS) {
    if (entry.keywords.some(k => nameLower.includes(k))) {
      return {
        group:  entry.group,
        icon:   entry.icon,
        reason: `Clinically recommended alongside ${medicineName}`,
        items:  entry.items,
      };
    }
  }

  // Layer 2: category-based match
  for (const [catKey, data] of Object.entries(CATEGORY_SUGGESTIONS)) {
    if (catLower.includes(catKey) || catKey.includes(catLower)) {
      return {
        group:  data.group,
        icon:   data.icon,
        reason: `Suggested for ${data.group} category medicines`,
        items:  data.items,
      };
    }
  }

  // Layer 3: universal fallback — always returns something
  return {
    group:  UNIVERSAL_FALLBACK.group,
    icon:   UNIVERSAL_FALLBACK.icon,
    reason: `General health support alongside ${medicineName}`,
    items:  UNIVERSAL_FALLBACK.items,
  };
}

/* ═══════════════════════════════════════════════════════════════
   AI Suggestion Panel Component
═══════════════════════════════════════════════════════════════ */
const AISuggestions = ({ medicineName, medicineCategory }) => {
  const suggestion = getSuggestions(medicineName, medicineCategory);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6,182,212,0.07), rgba(99,102,241,0.07))',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 14,
      padding: '16px 18px',
      animation: 'fadeSlideIn 0.35s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--cyan), var(--indigo))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem',
        }}>🤖</div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            AI Suggestions
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
            {suggestion.reason}
          </div>
        </div>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.6rem', padding: '2px 8px', borderRadius: 20,
          background: 'rgba(99,102,241,0.15)', color: 'var(--indigo)',
          fontWeight: 600, border: '1px solid rgba(99,102,241,0.25)', whiteSpace: 'nowrap',
        }}>
          {suggestion.icon} {suggestion.group}
        </span>
      </div>

      {/* Suggestion Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestion.items.map((item, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s ease', cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'rgba(6,182,212,0.1)';
              e.currentTarget.style.borderColor  = 'rgba(6,182,212,0.3)';
              e.currentTarget.style.transform    = 'translateX(4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background   = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform    = 'translateX(0)';
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>
              {suggestion.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.use}</div>
            </div>
            <div style={{
              fontSize: '0.65rem', color: 'var(--cyan)', opacity: 0.7,
              padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.2)', whiteSpace: 'nowrap',
            }}>
              Related
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>💡</span>
        <span>Based on standard pharmaceutical co-prescription guidelines</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Sales Page
═══════════════════════════════════════════════════════════════ */
const Sales = () => {
  const [medicines, setMedicines] = useState([]);
  const [medicineId, setMedicineId] = useState('');
  const [quantity, setQuantity]     = useState('');
  const [selling, setSelling]       = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = async () => {
    try { const r = await API.get('/inventory/medicines/'); setMedicines(r.data); }
    catch (e) { console.error(e); }
  };

  const selectedMed = medicines.find(m => String(m.id) === String(medicineId));

  const handleSale = async () => {
    if (!medicineId || !quantity) return alert('Please select a medicine and enter quantity');
    if (selectedMed && parseInt(quantity) > selectedMed.quantity)
      return alert(`Only ${selectedMed.quantity} units in stock`);
    setSelling(true);
    try {
      await API.post('/sales/', { medicine: medicineId, quantity: parseInt(quantity) });
      setSuccessMsg(`✅ Sale recorded — ${quantity} units of ${selectedMed?.name}`);
      setMedicineId(''); setQuantity('');
      fetchMedicines();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch { alert('Sale failed'); }
    setSelling(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          <div className="page-header">
            <h1>Record Sale</h1>
            <p>Process a new medicine sale and update stock automatically.</p>
          </div>

          {successMsg && (
            <div className="alert-banner alert-info animate-fade-up">{successMsg}</div>
          )}

          <div className="grid-2" style={{ alignItems: 'start' }}>

            {/* ── Left: Sale Form + AI Suggestions ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card card-pad">
                <div className="section-title" style={{ marginBottom: 20 }}>
                  <span className="dot dot-cyan" /> New Sale
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Medicine
                    </label>
                    <select
                      id="medicine-select"
                      className="form-select"
                      style={{ width: '100%' }}
                      value={medicineId}
                      onChange={e => { setMedicineId(e.target.value); setQuantity(''); }}
                    >
                      <option value="">Choose a medicine…</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} — Stock: {m.quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Quantity to Sell
                    </label>
                    <input
                      id="quantity-input"
                      type="number" min="1"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="Enter quantity…"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>

                  <button
                    id="confirm-sale-btn"
                    className="btn btn-primary"
                    onClick={handleSale}
                    disabled={selling || !medicineId || !quantity}
                    style={{ marginTop: 8 }}
                  >
                    {selling
                      ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</>
                      : '🛒 Confirm Sale'}
                  </button>

                  <button className="btn btn-ghost" onClick={() => navigate('/sales-history')}>
                    View Sales History →
                  </button>
                </div>
              </div>

              {/* AI Suggestions — always shows when a medicine is selected */}
              {selectedMed && (
                <AISuggestions
                  medicineName={selectedMed.name}
                  medicineCategory={selectedMed.category}
                />
              )}
            </div>

            {/* ── Right: Medicine Details ── */}
            <div className="glass-card card-pad">
              <div className="section-title" style={{ marginBottom: 20 }}>
                <span className="dot dot-indigo" /> Medicine Details
              </div>

              {selectedMed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedMed.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {selectedMed.category || 'General'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Current Stock', value: selectedMed.quantity,      accent: selectedMed.quantity < 20 ? 'var(--rose)' : 'var(--emerald)' },
                      { label: 'Price per Unit', value: `₹ ${selectedMed.price}`, accent: 'var(--cyan)' },
                      { label: 'Expiry Date',    value: selectedMed.expiry_date,   accent: 'var(--amber)' },
                      { label: 'Total from Sale', value: quantity ? `₹ ${(parseFloat(selectedMed.price) * parseInt(quantity)).toFixed(2)}` : '—', accent: 'var(--indigo)' },
                    ].map(({ label, value, accent }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                        <div style={{ fontWeight: 700, color: accent }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {selectedMed.quantity < 20 && (
                    <div className="alert-banner alert-danger" style={{ margin: 0 }}>
                      ⚠ Stock is critically low. Consider reordering.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💊</div>
                  Select a medicine to see its details here.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sales;