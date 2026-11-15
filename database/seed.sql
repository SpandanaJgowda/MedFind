-- MySQL dump 10.13  Distrib 26.10.0, for macos26.6 (arm64)
--
-- Host: localhost    Database: medifind_db
-- ------------------------------------------------------
-- Server version	26.10.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'f4337a72-d6c6-11f1-b5e8-bfe333530a39:1-128';

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Pain Relief & Fever','pain-relief','Analgesics, antipyretics and anti-inflammatory medications for pain and fever relief.','ShieldAlert','2026-11-15 00:26:46'),(2,'Antibiotics & Anti-infectives','antibiotics','Prescription antibacterial and anti-infective formulations.','Pill','2026-11-15 00:26:46'),(3,'Diabetes Care','diabetes-care','Blood glucose regulation tablets, insulin formulations and metabolic care.','Activity','2026-11-15 00:26:46'),(4,'Cardiovascular & BP','cardiovascular','Heart medications, antihypertensives, cholesterol regulators and blood thinners.','Heart','2026-11-15 00:26:46'),(5,'Respiratory & Asthma','respiratory','Bronchodilators, inhalers and medications for respiratory disorders.','Wind','2026-11-15 00:26:46'),(6,'Gastrointestinal & Antacids','gastrointestinal','Acid reflux relief, proton pump inhibitors, antacids and digestive aids.','FlaskConical','2026-11-15 00:26:46'),(7,'Allergy & Antihistamines','allergy','Antihistamines, allergy symptom relief and decongestants.','Sparkles','2026-11-15 00:26:46'),(8,'Vitamins & Supplements','vitamins','Essential daily vitamins, mineral supplements and immunity boosters.','Sun','2026-11-15 00:26:46');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,'Dolo 650 Tablet','Dolo 650','Paracetamol','Paracetamol','650mg','Tablet','Micro Labs Ltd',1,0,'Used for effective relief from mild to moderate fever, headache, body aches and pain.','Take 1 tablet every 4 to 6 hours as needed or directed by a physician. Do not exceed 4000mg in 24 hours.','Mild nausea, liver toxicity only upon exceeding recommended dosage.','2026-11-15 00:26:46'),(2,'Calpol 650 Tablet','Calpol 650','Paracetamol','Paracetamol','650mg','Tablet','GlaxoSmithKline Pharmaceuticals Ltd',1,0,'Fast-acting fever reducer and mild-to-moderate pain reliever.','Take 1 tablet after meals with water as prescribed. Do not exceed recommended dosage.','Rare allergic reactions, nausea.','2026-11-15 00:26:46'),(3,'Pacimol 650 Tablet','Pacimol 650','Paracetamol','Paracetamol','650mg','Tablet','Ipca Laboratories Ltd',1,0,'Paracetamol 650mg formulation for fever, post-vaccination fever and arthritis pain.','Take 1 tablet every 6 hours with food or water.','Rare skin rashes, gastric upset.','2026-11-15 00:26:46'),(4,'Augmentin 625 Duo Tablet','Augmentin 625 Duo','Amoxicillin + Clavulanic Acid','Amoxicillin (500mg) + Clavulanic Acid (125mg)','625mg','Tablet','GlaxoSmithKline Pharmaceuticals Ltd',2,1,'Broad-spectrum penicillin antibiotic combined with clavulanate to treat bacterial infections of ears, throat, lungs, skin and urinary tract.','Take with meals to minimize gastrointestinal discomfort. Complete the full course prescribed by your doctor.','Mild diarrhea, nausea, skin rash. Consult physician if severe.','2026-11-15 00:26:46'),(5,'Moxikind-CV 625 Tablet','Moxikind-CV 625','Amoxicillin + Clavulanic Acid','Amoxicillin (500mg) + Clavulanic Acid (125mg)','625mg','Tablet','Mankind Pharma Ltd',2,1,'Antibiotic medication for treating resistant bacterial infections in respiratory tract and soft tissues.','Take strictly as advised by doctor. Take at the start of a meal.','Diarrhea, vomiting, headache.','2026-11-15 00:26:46'),(6,'Clavam 625 Tablet','Clavam 625','Amoxicillin + Clavulanic Acid','Amoxicillin (500mg) + Clavulanic Acid (125mg)','625mg','Tablet','Alkem Laboratories Ltd',2,1,'Effective antibacterial combination for pneumonia, bronchitis and sinusitis infections.','Swallow whole with plenty of water at mealtime.','Loose stools, stomach ache, mild dizziness.','2026-11-15 00:26:46'),(7,'Glycomet 500mg Tablet','Glycomet 500','Metformin Hydrochloride','Metformin Hydrochloride','500mg','Tablet','USV Ltd',3,1,'First-line oral antidiabetic medicine for adults with type 2 diabetes mellitus to manage blood glucose levels.','Take with or immediately after meals to reduce stomach upset.','Nausea, diarrhea, metallic taste, abdominal pain.','2026-11-15 00:26:46'),(8,'Obimet 500mg Tablet','Obimet 500','Metformin Hydrochloride','Metformin Hydrochloride','500mg','Tablet','Abbott Healthcare Pvt Ltd',3,1,'Metformin oral therapy for improving insulin sensitivity and blood sugar management in type 2 diabetes.','Take once or twice daily with breakfast or dinner.','Stomach discomfort, flatulence, fatigue.','2026-11-15 00:26:46'),(9,'Atorva 10mg Tablet','Atorva 10','Atorvastatin Calcium','Atorvastatin Calcium','10mg','Tablet','Zydus Cadila',4,1,'Statin lipid-lowering medication to reduce LDL (bad cholesterol) and triglycerides and lower cardiovascular risks.','Take once daily at the same time, with or without food, preferably in the evening.','Muscle ache, headache, digestive disturbances.','2026-11-15 00:26:46'),(10,'Storvas 10mg Tablet','Storvas 10','Atorvastatin Calcium','Atorvastatin Calcium','10mg','Tablet','Sun Pharmaceutical Industries Ltd',4,1,'HMG-CoA reductase inhibitor for cholesterol and cardiovascular prevention therapy.','Take once daily at bedtime with water.','Mild muscle soreness, joint discomfort.','2026-11-15 00:26:46'),(11,'Pan 40mg Tablet','Pan 40','Pantoprazole Sodium','Pantoprazole Sodium','40mg','Tablet','Alkem Laboratories Ltd',6,0,'Proton pump inhibitor (PPI) that decreases stomach acid production for treating GERD, acidity and peptic ulcers.','Take 1 tablet in the morning 30-60 minutes before breakfast on an empty stomach.','Headache, stomach pain, flatulence.','2026-11-15 00:26:46'),(12,'Pantocid 40mg Tablet','Pantocid 40','Pantoprazole Sodium','Pantoprazole Sodium','40mg','Tablet','Sun Pharmaceutical Industries Ltd',6,0,'Rapid acid suppression medication for heartburn, acid reflux and gastroesophageal reflux disease.','Swallow whole with a glass of water before food in morning.','Mild dizziness, dry mouth.','2026-11-15 00:26:46'),(13,'Montair LC Tablet','Montair LC','Montelukast + Levocetirizine','Montelukast (10mg) + Levocetirizine (5mg)','10mg/5mg','Tablet','Cipla Ltd',7,0,'Dual-action formulation for allergic rhinitis, sneezing, runny nose, itchy eyes and asthma symptoms.','Take 1 tablet at night before sleeping, with or without food.','Mild sleepiness, fatigue, dry mouth, headache.','2026-11-15 00:26:46'),(14,'Telekast-L Tablet','Telekast-L','Montelukast + Levocetirizine','Montelukast (10mg) + Levocetirizine (5mg)','10mg/5mg','Tablet','Lupin Ltd',7,0,'Combined antihistamine and leukotriene receptor antagonist for hay fever and allergy relief.','Take once daily at bedtime as directed.','Drowsiness, dry mouth.','2026-11-15 00:26:46'),(15,'Azithral 500mg Tablet','Azithral 500','Azithromycin','Azithromycin','500mg','Tablet','Alembic Pharmaceuticals Ltd',2,1,'Macrolide antibiotic used to treat bacterial chest infections, tonsillitis, sinus infections and skin infections.','Take 1 tablet once a day 1 hour before or 2 hours after meals for 3 to 5 days as prescribed.','Nausea, loose stools, vomiting, abdominal cramps.','2026-11-15 00:26:46'),(16,'Azee 500mg Tablet','Azee 500','Azithromycin','Azithromycin','500mg','Tablet','Cipla Ltd',2,1,'Effective macrolide antibiotic against susceptible bacterial strains in respiratory and throat infections.','Take once daily on an empty stomach with a full glass of water.','Temporary nausea, stomach distress.','2026-11-15 00:26:46'),(17,'Asthalin 100mcg Inhaler','Asthalin Inhaler','Salbutamol','Salbutamol','100mcg/puff','Inhaler','Cipla Ltd',5,1,'Fast-acting bronchodilator inhaler for instant relief from sudden wheezing, shortness of breath and asthma attacks.','Inhale 1 to 2 puffs during sudden breathlessness or 15 minutes before exercise.','Tremors, increased heart rate, mild nervousness.','2026-11-15 00:26:46'),(18,'Budecort 200 Inhaler','Budecort 200','Budesonide','Budesonide','200mcg/puff','Inhaler','Cipla Ltd',5,1,'Corticosteroid maintenance inhaler to prevent asthma exacerbations and chronic bronchitis swelling.','Rinse mouth thoroughly with water after each inhalation to prevent fungal infection.','Hoarseness of voice, throat irritation.','2026-11-15 00:26:46');
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `pharmacies`
--

LOCK TABLES `pharmacies` WRITE;
/*!40000 ALTER TABLE `pharmacies` DISABLE KEYS */;
INSERT INTO `pharmacies` VALUES (1,2,'Apollo Pharmacy Central','Dr. Rajesh Kumar','KA-BLR-PH-2021-0891','+91 80 2558 4411','apollocentral@medifind.com','No. 45, MG Road, Ashok Nagar','Bengaluru','Karnataka','560001',12.9715987,77.5945627,'08:00 AM - 11:00 PM','approved','2026-11-15 00:26:46','2026-11-15 00:26:46'),(2,3,'MedPlus Healthcare Koramangala','Suresh Reddy','KA-BLR-PH-2019-1422','+91 80 2552 1100','medpluscare@medifind.com','Shop 12, 80 Feet Road, 4th Block, Koramangala','Bengaluru','Karnataka','560034',12.9351929,77.6244806,'07:30 AM - 11:30 PM','approved','2026-11-15 00:26:46','2026-11-15 00:26:46'),(3,4,'Wellness Forever 24/7 Indiranagar','Meera Rao','KA-BLR-PH-2022-3109','+91 80 4123 9988','wellnessfirst@medifind.com','Plot 722, 100 Feet Road, HAL 2nd Stage, Indiranagar','Bengaluru','Karnataka','560038',12.9783692,77.6408356,'24 Hours Open','approved','2026-11-15 00:26:46','2026-11-15 00:26:46'),(4,5,'HealthKart Pharmacy Rajajinagar','Anand Hegde','KA-BLR-PH-2020-2218','+91 80 2315 7766','healthkart@medifind.com','33, 1st Block, Dr. Rajkumar Road, Rajajinagar','Bengaluru','Karnataka','560010',12.9900213,77.5524819,'08:30 AM - 10:30 PM','approved','2026-11-15 00:26:46','2026-11-15 00:26:46'),(5,6,'Lifeline Chemists & Druggists','Vikram Shenoy','KA-BLR-PH-2024-5541','+91 80 6789 1234','lifelinechemists@medifind.com','512, 27th Main Road, Sector 1, HSR Layout','Bengaluru','Karnataka','560102',12.9141417,77.6366024,'09:00 AM - 10:00 PM','pending','2026-11-15 00:26:46','2026-11-15 00:26:46');
/*!40000 ALTER TABLE `pharmacies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `pharmacy_inventory`
--

LOCK TABLES `pharmacy_inventory` WRITE;
/*!40000 ALTER TABLE `pharmacy_inventory` DISABLE KEYS */;
INSERT INTO `pharmacy_inventory` VALUES (1,1,1,32.50,48,10,'2026-11-15 00:26:46'),(2,1,2,34.00,25,10,'2026-11-15 00:26:46'),(3,1,3,29.00,3,5,'2026-11-15 00:26:46'),(4,1,4,210.00,30,8,'2026-11-15 00:26:46'),(5,1,5,175.00,18,5,'2026-11-15 00:26:46'),(6,1,7,65.00,50,15,'2026-11-15 00:26:46'),(7,1,9,115.00,22,5,'2026-11-15 00:26:46'),(8,1,11,155.00,35,10,'2026-11-15 00:26:46'),(9,1,13,195.00,20,5,'2026-11-15 00:26:46'),(10,1,15,125.00,14,5,'2026-11-15 00:26:46'),(11,1,17,145.00,12,4,'2026-11-15 00:26:46'),(12,2,1,30.00,60,10,'2026-11-15 00:26:46'),(13,2,2,33.50,4,5,'2026-11-15 00:26:46'),(14,2,4,205.00,22,6,'2026-11-15 00:26:46'),(15,2,6,185.00,15,5,'2026-11-15 00:26:46'),(16,2,7,62.00,40,10,'2026-11-15 00:26:46'),(17,2,8,58.00,0,5,'2026-11-15 00:26:46'),(18,2,9,110.00,19,5,'2026-11-15 00:26:46'),(19,2,10,98.00,15,5,'2026-11-15 00:26:46'),(20,2,11,150.00,28,8,'2026-11-15 00:26:46'),(21,2,12,142.00,20,5,'2026-11-15 00:26:46'),(22,2,13,190.00,16,5,'2026-11-15 00:26:46'),(23,2,14,180.00,25,5,'2026-11-15 00:26:46'),(24,2,15,120.00,18,5,'2026-11-15 00:26:46'),(25,2,17,140.00,8,3,'2026-11-15 00:26:46'),(26,3,1,33.00,55,10,'2026-11-15 00:26:46'),(27,3,2,35.00,30,8,'2026-11-15 00:26:46'),(28,3,4,215.00,14,5,'2026-11-15 00:26:46'),(29,3,5,180.00,20,5,'2026-11-15 00:26:46'),(30,3,7,68.00,35,10,'2026-11-15 00:26:46'),(31,3,9,120.00,25,6,'2026-11-15 00:26:46'),(32,3,11,160.00,40,10,'2026-11-15 00:26:46'),(33,3,13,200.00,22,5,'2026-11-15 00:26:46'),(34,3,15,130.00,15,5,'2026-11-15 00:26:46'),(35,3,16,115.00,24,6,'2026-11-15 00:26:46'),(36,3,17,150.00,15,4,'2026-11-15 00:26:46'),(37,3,18,320.00,10,3,'2026-11-15 00:26:46'),(38,4,1,29.50,70,15,'2026-11-15 00:26:46'),(39,4,3,28.00,35,10,'2026-11-15 00:26:46'),(40,4,4,202.00,18,5,'2026-11-15 00:26:46'),(41,4,7,60.00,45,10,'2026-11-15 00:26:46'),(42,4,9,108.00,30,8,'2026-11-15 00:26:46'),(43,4,11,148.00,32,8,'2026-11-15 00:26:46'),(44,4,13,188.00,20,5,'2026-11-15 00:26:46'),(45,4,17,138.00,16,5,'2026-11-15 00:26:46');
/*!40000 ALTER TABLE `pharmacy_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,'MF-RES-84920',7,1,1,2,32.50,65.00,'Ready for Pickup','Severe viral fever since yesterday, please keep ready.','Prescription verified. Kept at counter 2.','2026-11-14 20:26:47','2026-11-15 00:26:46',NULL),(2,'MF-RES-84921',7,2,4,1,205.00,205.00,'Pending','Have doctor prescription on phone.',NULL,'2026-11-14 23:26:47','2026-11-15 00:26:46',NULL),(3,'MF-RES-72314',8,1,7,3,65.00,195.00,'Completed','Monthly diabetes medication refill.','Dispensed on 14 Nov 2026.','2026-11-13 00:26:47','2026-11-15 00:26:46',NULL),(4,'MF-RES-91823',9,3,17,1,150.00,150.00,'Confirmed','Urgent asthma inhaler requirement.','Reserved. Available for 24 hours.','2026-11-14 18:26:47','2026-11-15 00:26:46',NULL),(5,'MF-RES-61902',8,2,11,2,150.00,300.00,'Cancelled','Ordered alternative instead.','Reservation cancelled by patient.','2026-11-10 00:26:47','2026-11-15 00:26:46',NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `search_logs`
--

LOCK TABLES `search_logs` WRITE;
/*!40000 ALTER TABLE `search_logs` DISABLE KEYS */;
INSERT INTO `search_logs` VALUES (1,7,'Dolo 650','Pain Relief & Fever',4,'2026-11-14 19:26:47'),(2,7,'Augmentin 625','Antibiotics & Anti-infectives',3,'2026-11-14 22:26:47'),(3,8,'Glycomet 500','Diabetes Care',3,'2026-11-12 00:26:47'),(4,9,'Asthalin','Respiratory & Asthma',3,'2026-11-14 17:26:47'),(5,NULL,'Paracetamol','Pain Relief & Fever',4,'2026-11-14 12:26:47'),(6,NULL,'Atorva 10','Cardiovascular & BP',4,'2026-11-14 00:26:47'),(7,NULL,'Montair LC','Allergy & Antihistamines',3,'2026-11-14 06:26:47');
/*!40000 ALTER TABLE `search_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin@medifind.com','$2a$10$c3.fjePQ6KQaEfXEo1WxnOOC0j9LiysmABkkxLa.SlBwN.MQMqBEa','admin','+91 9876543210','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(2,'Dr. Rajesh Kumar','apollocentral@medifind.com','$2a$10$Bg87J6NWdxQbRpGz6Byyp.XDJVh7pTAXN.LnnguvhFg5T96iX5KuO','pharmacy_owner','+91 9811122233','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(3,'Suresh Reddy','medpluscare@medifind.com','$2a$10$Bg87J6NWdxQbRpGz6Byyp.XDJVh7pTAXN.LnnguvhFg5T96iX5KuO','pharmacy_owner','+91 9822233344','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(4,'Meera Rao','wellnessfirst@medifind.com','$2a$10$Bg87J6NWdxQbRpGz6Byyp.XDJVh7pTAXN.LnnguvhFg5T96iX5KuO','pharmacy_owner','+91 9833344455','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(5,'Anand Hegde','healthkart@medifind.com','$2a$10$Bg87J6NWdxQbRpGz6Byyp.XDJVh7pTAXN.LnnguvhFg5T96iX5KuO','pharmacy_owner','+91 9844455566','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(6,'Vikram Shenoy','lifelinechemists@medifind.com','$2a$10$Bg87J6NWdxQbRpGz6Byyp.XDJVh7pTAXN.LnnguvhFg5T96iX5KuO','pharmacy_owner','+91 9855566677','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(7,'Rahul Sharma','patient@medifind.com','$2a$10$UKOLffgvXd3ljo9OdnHN3O96.BTvnkXwcARFvZS00Y5hTbsC.AO7a','patient','+91 9900011122','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(8,'Priya Patel','priya.patel@medifind.com','$2a$10$UKOLffgvXd3ljo9OdnHN3O96.BTvnkXwcARFvZS00Y5hTbsC.AO7a','patient','+91 9911122233','active','2026-11-15 00:26:46','2026-11-15 00:26:46'),(9,'Anita Deshmukh','anita.deshmukh@medifind.com','$2a$10$UKOLffgvXd3ljo9OdnHN3O96.BTvnkXwcARFvZS00Y5hTbsC.AO7a','patient','+91 9922233344','active','2026-11-15 00:26:46','2026-11-15 00:26:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-15  0:27:07
