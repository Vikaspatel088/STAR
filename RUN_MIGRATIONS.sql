-- ============================================
-- COMBINED MIGRATION: Add Category & Seed Rajasthan Places
-- ============================================
-- Run this SQL in your Supabase Dashboard SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new
-- ============================================

-- Step 1: Add category field to monuments table
ALTER TABLE public.monuments 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
  'fort', 
  'palace', 
  'monument', 
  'temple', 
  'lake', 
  'wildlife_sanctuary', 
  'desert', 
  'museum', 
  'heritage_site', 
  'garden', 
  'stepwell', 
  'haveli', 
  'market', 
  'hill_station'
));

-- Add unique constraint on name to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'monuments_name_unique'
  ) THEN
    ALTER TABLE public.monuments 
    ADD CONSTRAINT monuments_name_unique UNIQUE (name);
  END IF;
END $$;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_monuments_category ON public.monuments(category);

-- Create index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_monuments_city ON public.monuments(city);

-- Step 2: Update existing monuments with categories
UPDATE public.monuments SET category = 'palace' WHERE name = 'Hawa Mahal';
UPDATE public.monuments SET category = 'fort' WHERE name = 'Amber Fort';
UPDATE public.monuments SET category = 'palace' WHERE name = 'City Palace Jaipur';
UPDATE public.monuments SET category = 'fort' WHERE name = 'Mehrangarh Fort';
UPDATE public.monuments SET category = 'palace' WHERE name = 'Umaid Bhawan Palace';
UPDATE public.monuments SET category = 'palace' WHERE name = 'City Palace Udaipur';
UPDATE public.monuments SET category = 'palace' WHERE name = 'Lake Palace';
UPDATE public.monuments SET category = 'fort' WHERE name = 'Jaisalmer Fort';
UPDATE public.monuments SET category = 'haveli' WHERE name = 'Patwon Ki Haveli';
UPDATE public.monuments SET category = 'fort' WHERE name = 'Ranthambore Fort';

-- Step 3: Insert comprehensive list of Rajasthan tourist places
-- Using INSERT ... ON CONFLICT to avoid duplicates
INSERT INTO public.monuments (name, description, city, state, category, latitude, longitude, indian_price, foreign_price) VALUES
-- JAIPUR
('Jantar Mantar', 'UNESCO World Heritage Site, collection of 19 astronomical instruments', 'Jaipur', 'Rajasthan', 'monument', 26.9247, 75.8246, 50, 200),
('Nahargarh Fort', 'Hilltop fort offering panoramic views of Jaipur city', 'Jaipur', 'Rajasthan', 'fort', 26.9364, 75.8167, 50, 200),
('Jaigarh Fort', 'Fort known for housing the world''s largest cannon on wheels', 'Jaipur', 'Rajasthan', 'fort', 26.9859, 75.8497, 50, 200),
('Albert Hall Museum', 'Oldest museum in Rajasthan, Indo-Saracenic architecture', 'Jaipur', 'Rajasthan', 'museum', 26.9124, 75.7873, 40, 150),
('Birla Mandir', 'Modern Hindu temple made of white marble', 'Jaipur', 'Rajasthan', 'temple', 26.9000, 75.8167, 0, 0),
('Galtaji Temple', 'Ancient Hindu temple complex, also known as Monkey Temple', 'Jaipur', 'Rajasthan', 'temple', 26.9124, 75.8500, 0, 0),
('Sisodia Rani Garden', 'Beautiful terraced garden with fountains and pavilions', 'Jaipur', 'Rajasthan', 'garden', 26.8500, 75.8500, 20, 50),
('Chokhi Dhani', 'Ethnic village resort showcasing Rajasthani culture and cuisine', 'Jaipur', 'Rajasthan', 'heritage_site', 26.8000, 75.8000, 500, 1000),
('Johari Bazaar', 'Famous jewelry market in the heart of Pink City', 'Jaipur', 'Rajasthan', 'market', 26.9200, 75.8200, 0, 0),
('Maharaja Sawai Man Singh II Museum', 'Museum showcasing royal artifacts and weapons', 'Jaipur', 'Rajasthan', 'museum', 26.9258, 75.8237, 50, 200),

-- UDAIPUR
('Jag Mandir', 'Palace island on Lake Pichola, also known as Lake Garden Palace', 'Udaipur', 'Rajasthan', 'palace', 24.5700, 73.6800, 200, 400),
('Fateh Sagar Lake', 'Artificial lake with three islands, popular for boating', 'Udaipur', 'Rajasthan', 'lake', 24.6000, 73.7000, 50, 100),
('Saheliyon Ki Bari', 'Garden of the Maidens, beautiful garden with fountains and marble pavilions', 'Udaipur', 'Rajasthan', 'garden', 24.5800, 73.6900, 20, 50),
('Bagore Ki Haveli', '18th-century haveli converted into a museum showcasing royal lifestyle', 'Udaipur', 'Rajasthan', 'museum', 24.5760, 73.6880, 30, 100),
('Jagdish Temple', 'Large Hindu temple dedicated to Lord Vishnu, built in 1651', 'Udaipur', 'Rajasthan', 'temple', 24.5760, 73.6880, 0, 0),
('Monsoon Palace', 'Hilltop palace offering stunning views, also known as Sajjangarh Palace', 'Udaipur', 'Rajasthan', 'palace', 24.5500, 73.6500, 50, 200),
('Shilpgram', 'Rural arts and crafts complex showcasing traditional village life', 'Udaipur', 'Rajasthan', 'heritage_site', 24.5500, 73.7000, 30, 100),
('Pichola Lake', 'Famous lake with Lake Palace and Jag Mandir', 'Udaipur', 'Rajasthan', 'lake', 24.5750, 73.6800, 200, 400),

-- JODHPUR
('Jaswant Thada', 'Marble cenotaph built in memory of Maharaja Jaswant Singh II', 'Jodhpur', 'Rajasthan', 'monument', 26.2950, 73.0200, 30, 100),
('Mandore Gardens', 'Ancient capital ruins with cenotaphs and temples', 'Jodhpur', 'Rajasthan', 'garden', 26.3500, 73.0500, 20, 50),
('Clock Tower', 'Historic clock tower in the heart of the old city', 'Jodhpur', 'Rajasthan', 'monument', 26.2900, 73.0200, 0, 0),
('Balsamand Lake', 'Artificial lake and palace, perfect for picnics', 'Jodhpur', 'Rajasthan', 'lake', 26.3000, 73.0000, 20, 50),
('Rao Jodha Desert Rock Park', 'Ecological restoration park near Mehrangarh Fort', 'Jodhpur', 'Rajasthan', 'garden', 26.2950, 73.0180, 100, 200),
('Machia Biological Park', 'Biological park showcasing desert wildlife', 'Jodhpur', 'Rajasthan', 'wildlife_sanctuary', 26.3000, 73.0000, 50, 200),
('Kaylana Lake', 'Artificial lake perfect for picnics and boating', 'Jodhpur', 'Rajasthan', 'lake', 26.3000, 73.0000, 20, 50),
('Sardar Samand Lake', 'Beautiful lake and palace, perfect for bird watching', 'Jodhpur', 'Rajasthan', 'lake', 26.2000, 73.0000, 30, 100),
('Central Museum', 'Government museum with collection of artifacts', 'Jodhpur', 'Rajasthan', 'museum', 26.2900, 73.0200, 20, 50),

-- JAISALMER
('Sam Sand Dunes', 'Desert dunes perfect for camel safaris and sunset views', 'Jaisalmer', 'Rajasthan', 'desert', 26.9000, 70.8500, 100, 300),
('Nathmal Ki Haveli', 'Haveli built by two brothers, known for its unique architecture', 'Jaisalmer', 'Rajasthan', 'haveli', 26.9150, 70.9160, 30, 100),
('Salim Singh Ki Haveli', '300-year-old haveli with distinctive peacock-shaped roof', 'Jaisalmer', 'Rajasthan', 'haveli', 26.9140, 70.9160, 30, 100),
('Gadisar Lake', 'Artificial lake surrounded by temples and ghats', 'Jaisalmer', 'Rajasthan', 'lake', 26.9200, 70.9200, 0, 0),
('Jain Temples', 'Complex of 7 Jain temples within Jaisalmer Fort', 'Jaisalmer', 'Rajasthan', 'temple', 26.9124, 70.9128, 50, 200),
('Bada Bagh', 'Garden with cenotaphs of Jaisalmer rulers', 'Jaisalmer', 'Rajasthan', 'garden', 26.9500, 70.9000, 20, 50),
('Kuldhara Village', 'Abandoned village with mysterious history', 'Jaisalmer', 'Rajasthan', 'heritage_site', 26.8500, 70.8500, 50, 100),
('Desert National Park', 'Protected area showcasing desert ecosystem and wildlife', 'Jaisalmer', 'Rajasthan', 'wildlife_sanctuary', 26.8000, 70.8000, 100, 400),

-- AJMER
('Ajmer Sharif Dargah', 'Sufi shrine of Khwaja Moinuddin Chishti, one of the holiest places in India', 'Ajmer', 'Rajasthan', 'heritage_site', 26.4560, 74.6310, 0, 0),
('Ana Sagar Lake', 'Artificial lake built by Anaji Chauhan, surrounded by parks', 'Ajmer', 'Rajasthan', 'lake', 26.4600, 74.6400, 0, 0),
('Taragarh Fort', 'Hill fort offering panoramic views of Ajmer city', 'Ajmer', 'Rajasthan', 'fort', 26.4500, 74.6200, 20, 50),
('Adhai Din Ka Jhonpra', 'Ancient mosque with Indo-Islamic architecture', 'Ajmer', 'Rajasthan', 'heritage_site', 26.4560, 74.6300, 0, 0),
('Akbar''s Palace', 'Mughal palace now housing the Government Museum', 'Ajmer', 'Rajasthan', 'museum', 26.4560, 74.6320, 20, 50),
('Nasiyan Jain Temple', 'Famous Jain temple with golden interior', 'Ajmer', 'Rajasthan', 'temple', 26.4580, 74.6350, 0, 0),

-- PUSHKAR
('Pushkar Lake', 'Sacred lake surrounded by 52 ghats, one of the holiest places for Hindus', 'Pushkar', 'Rajasthan', 'lake', 26.4900, 74.5500, 0, 0),
('Brahma Temple', 'One of the very few temples dedicated to Lord Brahma in the world', 'Pushkar', 'Rajasthan', 'temple', 26.4900, 74.5500, 0, 0),
('Pushkar Camel Fair', 'World''s largest camel fair held annually in November', 'Pushkar', 'Rajasthan', 'heritage_site', 26.4900, 74.5500, 0, 0),
('Savitri Temple', 'Temple dedicated to Goddess Savitri, located on a hilltop', 'Pushkar', 'Rajasthan', 'temple', 26.4950, 74.5500, 0, 0),
('Rangji Temple', 'South Indian style temple with Dravidian architecture', 'Pushkar', 'Rajasthan', 'temple', 26.4900, 74.5520, 0, 0),

-- CHITTORGARH
('Chittorgarh Fort', 'Largest fort in India, UNESCO World Heritage Site, symbol of Rajput valor', 'Chittorgarh', 'Rajasthan', 'fort', 24.8883, 74.6470, 50, 200),
('Vijay Stambh', 'Victory Tower built to commemorate victory over Malwa and Gujarat', 'Chittorgarh', 'Rajasthan', 'monument', 24.8883, 74.6470, 0, 0),
('Kirti Stambh', 'Tower of Fame dedicated to first Jain Tirthankara', 'Chittorgarh', 'Rajasthan', 'monument', 24.8883, 74.6470, 0, 0),
('Rana Kumbha Palace', 'Ruins of the palace where Rani Padmini performed Jauhar', 'Chittorgarh', 'Rajasthan', 'palace', 24.8883, 74.6470, 0, 0),
('Padmini Palace', 'Palace where Rani Padmini lived, surrounded by water', 'Chittorgarh', 'Rajasthan', 'palace', 24.8883, 74.6470, 0, 0),
('Meera Temple', 'Temple dedicated to Meera Bai, famous devotee of Lord Krishna', 'Chittorgarh', 'Rajasthan', 'temple', 24.8883, 74.6470, 0, 0),
('Kalika Mata Temple', 'Ancient temple dedicated to Goddess Kali', 'Chittorgarh', 'Rajasthan', 'temple', 24.8883, 74.6470, 0, 0),

-- BIKANER
('Junagarh Fort', 'Unconquered fort with beautiful palaces and courtyards', 'Bikaner', 'Rajasthan', 'fort', 28.0229, 73.3119, 50, 200),
('Lalgarh Palace', 'Red sandstone palace built in Indo-Saracenic style', 'Bikaner', 'Rajasthan', 'palace', 28.0200, 73.3100, 50, 200),
('Karni Mata Temple', 'Famous temple with thousands of rats, also known as Rat Temple', 'Bikaner', 'Rajasthan', 'temple', 27.8000, 73.1000, 0, 0),
('National Research Centre on Camel', 'Research center and camel breeding farm', 'Bikaner', 'Rajasthan', 'heritage_site', 28.0000, 73.3000, 50, 100),
('Ganga Government Museum', 'Museum showcasing artifacts from Bikaner''s royal history', 'Bikaner', 'Rajasthan', 'museum', 28.0229, 73.3119, 20, 50),
('Laxmi Niwas Palace', 'Luxury hotel in former royal palace', 'Bikaner', 'Rajasthan', 'palace', 28.0200, 73.3100, 100, 300),
('Bhandasar Jain Temple', 'Beautiful Jain temple with intricate carvings', 'Bikaner', 'Rajasthan', 'temple', 28.0220, 73.3120, 0, 0),

-- ALWAR
('Bala Quila', 'Ancient fort offering panoramic views of Alwar city', 'Alwar', 'Rajasthan', 'fort', 27.5667, 76.6167, 30, 100),
('City Palace Alwar', 'Royal palace now housing government offices and museum', 'Alwar', 'Rajasthan', 'palace', 27.5667, 76.6167, 30, 100),
('Sariska Tiger Reserve', 'National park and tiger reserve, home to various wildlife', 'Alwar', 'Rajasthan', 'wildlife_sanctuary', 27.3333, 76.4167, 200, 800),
('Siliserh Lake', 'Picturesque lake with palace on its banks', 'Alwar', 'Rajasthan', 'lake', 27.5000, 76.5000, 20, 50),
('Vijay Mandir Palace', 'Beautiful palace built by Maharaja Jai Singh', 'Alwar', 'Rajasthan', 'palace', 27.5500, 76.6000, 50, 150),
('Moosi Maharani Ki Chhatri', 'Cenotaph built in memory of Maharaja Bakhtawar Singh and his queen', 'Alwar', 'Rajasthan', 'monument', 27.5667, 76.6167, 0, 0),

-- MOUNT ABU
('Dilwara Jain Temples', 'Famous Jain temples known for intricate marble carvings', 'Mount Abu', 'Rajasthan', 'temple', 24.5925, 72.7156, 0, 0),
('Nakki Lake', 'Sacred lake in the heart of Mount Abu, perfect for boating', 'Mount Abu', 'Rajasthan', 'lake', 24.5925, 72.7156, 50, 100),
('Guru Shikhar', 'Highest peak in Aravalli Range, offering stunning views', 'Mount Abu', 'Rajasthan', 'hill_station', 24.6500, 72.7833, 0, 0),
('Sunset Point', 'Popular viewpoint for watching spectacular sunsets', 'Mount Abu', 'Rajasthan', 'hill_station', 24.6000, 72.7000, 0, 0),
('Achaleshwar Mahadev Temple', 'Ancient Shiva temple with toe impression of Lord Shiva', 'Mount Abu', 'Rajasthan', 'temple', 24.5925, 72.7156, 0, 0),
('Adhar Devi Temple', 'Temple carved out of a single rock, dedicated to Goddess Durga', 'Mount Abu', 'Rajasthan', 'temple', 24.6000, 72.7200, 0, 0),
('Mount Abu Wildlife Sanctuary', 'Sanctuary home to various species of flora and fauna', 'Mount Abu', 'Rajasthan', 'wildlife_sanctuary', 24.6000, 72.7000, 50, 200),

-- RANTHAMBORE (Sawai Madhopur)
('Ranthambore National Park', 'Famous tiger reserve and national park, best place to spot tigers', 'Sawai Madhopur', 'Rajasthan', 'wildlife_sanctuary', 26.0173, 76.4556, 200, 1200),
('Trinetra Ganesh Temple', 'Ancient temple inside Ranthambore Fort', 'Sawai Madhopur', 'Rajasthan', 'temple', 26.0173, 76.4556, 0, 0),
('Surwal Lake', 'Beautiful lake near Ranthambore, great for bird watching', 'Sawai Madhopur', 'Rajasthan', 'lake', 26.0500, 76.4500, 0, 0),

-- BUNDI
('Bundi Palace', 'Magnificent palace with beautiful murals and frescoes', 'Bundi', 'Rajasthan', 'palace', 25.4419, 75.6375, 50, 200),
('Taragarh Fort', 'Hill fort offering panoramic views of Bundi', 'Bundi', 'Rajasthan', 'fort', 25.4419, 75.6375, 30, 100),
('Raniji Ki Baori', 'Beautiful stepwell with intricate carvings', 'Bundi', 'Rajasthan', 'stepwell', 25.4419, 75.6375, 20, 50),
('Sukh Mahal', 'Summer palace on the banks of Jait Sagar Lake', 'Bundi', 'Rajasthan', 'palace', 25.4419, 75.6375, 30, 100),
('Nawal Sagar Lake', 'Artificial lake with Varuna Temple in the center', 'Bundi', 'Rajasthan', 'lake', 25.4419, 75.6375, 0, 0),

-- KOTA
('Kota Garh Palace', 'Royal palace complex with beautiful architecture', 'Kota', 'Rajasthan', 'palace', 25.1800, 75.8300, 50, 200),
('Chambal Garden', 'Beautiful garden on the banks of Chambal River', 'Kota', 'Rajasthan', 'garden', 25.1800, 75.8300, 20, 50),
('Seven Wonders Park', 'Park featuring replicas of seven wonders of the world', 'Kota', 'Rajasthan', 'garden', 25.1800, 75.8300, 50, 100),
('Kishore Sagar Lake', 'Artificial lake with beautiful island palace', 'Kota', 'Rajasthan', 'lake', 25.1800, 75.8300, 20, 50),
('Jagmandir Palace', 'Island palace in the middle of Kishore Sagar Lake', 'Kota', 'Rajasthan', 'palace', 25.1800, 75.8300, 30, 100),

-- BHARATPUR
('Keoladeo National Park', 'UNESCO World Heritage Site, famous bird sanctuary', 'Bharatpur', 'Rajasthan', 'wildlife_sanctuary', 27.1592, 77.5150, 75, 500),
('Lohagarh Fort', 'Iron Fort, one of the strongest forts in Rajasthan', 'Bharatpur', 'Rajasthan', 'fort', 27.2167, 77.5000, 20, 50),
('Deeg Palace', 'Summer palace with beautiful gardens and fountains', 'Bharatpur', 'Rajasthan', 'palace', 27.4667, 77.3333, 30, 100),
('Government Museum', 'Museum showcasing artifacts from Bharatpur''s history', 'Bharatpur', 'Rajasthan', 'museum', 27.2167, 77.5000, 10, 50),

-- SHEKHAWATI REGION
('Mandawa Fort', 'Fort converted into a heritage hotel', 'Mandawa', 'Rajasthan', 'fort', 28.0500, 75.1500, 50, 200),
('Mandawa Havelis', 'Famous for beautifully painted havelis with frescoes', 'Mandawa', 'Rajasthan', 'haveli', 28.0500, 75.1500, 30, 100),
('Nawalgarh Fort', 'Fort with beautiful architecture', 'Nawalgarh', 'Rajasthan', 'fort', 27.8500, 75.2667, 30, 100),
('Dundlod Fort', 'Heritage fort with museum', 'Dundlod', 'Rajasthan', 'fort', 28.0000, 75.2000, 50, 200),
('Fatehpur Havelis', 'Beautiful havelis with intricate frescoes', 'Fatehpur', 'Rajasthan', 'haveli', 27.9833, 74.9500, 20, 50),
('Sikar Fort', 'Historic fort in the Shekhawati region', 'Sikar', 'Rajasthan', 'fort', 27.6167, 75.1500, 20, 50),
('Jhunjhunu Havelis', 'Beautiful painted havelis with frescoes', 'Jhunjhunu', 'Rajasthan', 'haveli', 28.1333, 75.4000, 20, 50),

-- OTHER IMPORTANT PLACES
('Kumbhalgarh Fort', 'UNESCO World Heritage Site, second longest wall after Great Wall of China', 'Kumbhalgarh', 'Rajasthan', 'fort', 25.1475, 73.5831, 50, 200),
('Ranakpur Jain Temple', 'Famous Jain temple complex with 1444 marble pillars', 'Ranakpur', 'Rajasthan', 'temple', 25.1125, 73.4611, 0, 0),
('Bhangarh Fort', 'Haunted fort, one of the most haunted places in India', 'Bhangarh', 'Rajasthan', 'fort', 27.0944, 76.2861, 0, 0),
('Abhaneri Stepwell', 'Ancient stepwell, one of the largest and deepest in India', 'Abhaneri', 'Rajasthan', 'stepwell', 27.0075, 76.6069, 20, 50),
('Tal Chhapar Sanctuary', 'Blackbuck sanctuary, home to large population of blackbucks', 'Churu', 'Rajasthan', 'wildlife_sanctuary', 27.8333, 74.4167, 50, 200),
('Osian Temples', 'Group of ancient Hindu and Jain temples, known as Khajuraho of Rajasthan', 'Osian', 'Rajasthan', 'temple', 26.7167, 72.9167, 20, 50),
('Khatu Shyamji Temple', 'Famous temple dedicated to Khatu Shyam, form of Lord Krishna', 'Khatu', 'Rajasthan', 'temple', 27.3833, 74.9167, 0, 0),
('Salasar Balaji Temple', 'Famous temple dedicated to Lord Hanuman', 'Salasar', 'Rajasthan', 'temple', 27.8333, 74.9167, 0, 0),
('Gagron Fort', 'Hill and water fort, UNESCO World Heritage Site', 'Jhalawar', 'Rajasthan', 'fort', 24.6167, 76.1833, 30, 100),
('Jhalawar Fort', 'Fort with beautiful architecture and museum', 'Jhalawar', 'Rajasthan', 'fort', 24.6000, 76.1500, 30, 100),
('Bhimtal Lake', 'Beautiful lake near Jhalawar', 'Jhalawar', 'Rajasthan', 'lake', 24.6000, 76.1500, 0, 0),
('Ramgarh Lake', 'Picturesque lake near Jaipur', 'Ramgarh', 'Rajasthan', 'lake', 27.2500, 75.1833, 0, 0),
('Dausa Stepwell', 'Ancient stepwell with beautiful architecture', 'Dausa', 'Rajasthan', 'stepwell', 26.8833, 76.3333, 0, 0),
('Karauli City Palace', 'Royal palace with beautiful architecture', 'Karauli', 'Rajasthan', 'palace', 26.5000, 77.0167, 50, 200),
('Kaila Devi Temple', 'Famous temple dedicated to Goddess Kaila Devi', 'Karauli', 'Rajasthan', 'temple', 26.5000, 77.0167, 0, 0),
('Dholpur Palace', 'Royal palace with beautiful gardens', 'Dholpur', 'Rajasthan', 'palace', 26.7000, 77.9000, 50, 200),
('Rajsamand Lake', 'Historic lake built by Maharana Raj Singh', 'Rajsamand', 'Rajasthan', 'lake', 25.0667, 73.8833, 0, 0)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  indian_price = EXCLUDED.indian_price,
  foreign_price = EXCLUDED.foreign_price;

-- Verify the migration
SELECT 
  COUNT(*) as total_monuments,
  COUNT(DISTINCT city) as total_cities,
  COUNT(DISTINCT category) as total_categories
FROM public.monuments;
