-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('tourist', 'tour_guide', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create tourists table for Digital Tourist ID
CREATE TABLE public.tourists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digital_tourist_id TEXT NOT NULL UNIQUE,
  tourist_type TEXT NOT NULL CHECK (tourist_type IN ('indian', 'foreign')),
  id_hash TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('solo', 'group')),
  xp_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create monuments table
CREATE TABLE public.monuments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Rajasthan',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  indian_price DECIMAL(10, 2) NOT NULL,
  foreign_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tourist_id UUID NOT NULL REFERENCES public.tourists(id) ON DELETE CASCADE,
  monument_id UUID NOT NULL REFERENCES public.monuments(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('indian', 'foreign')),
  visit_date DATE NOT NULL,
  qr_code TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check_ins table for footfall tracking
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  monument_id UUID NOT NULL REFERENCES public.monuments(id) ON DELETE CASCADE,
  tourist_id UUID NOT NULL REFERENCES public.tourists(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Create tour_guides table
CREATE TABLE public.tour_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  languages TEXT[] NOT NULL,
  experience_years INTEGER NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create guide_monuments junction table
CREATE TABLE public.guide_monuments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.tour_guides(id) ON DELETE CASCADE,
  monument_id UUID NOT NULL REFERENCES public.monuments(id) ON DELETE CASCADE,
  UNIQUE(guide_id, monument_id)
);

-- Create guide_ratings table
CREATE TABLE public.guide_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.tour_guides(id) ON DELETE CASCADE,
  tourist_id UUID NOT NULL REFERENCES public.tourists(id) ON DELETE CASCADE,
  behaviour_rating INTEGER NOT NULL CHECK (behaviour_rating >= 1 AND behaviour_rating <= 5),
  language_rating INTEGER NOT NULL CHECK (language_rating >= 1 AND language_rating <= 5),
  responsibility_rating INTEGER NOT NULL CHECK (responsibility_rating >= 1 AND responsibility_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sos_events table
CREATE TABLE public.sos_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tourist_id UUID NOT NULL REFERENCES public.tourists(id) ON DELETE CASCADE,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('medical', 'lost', 'harassment', 'unsafe_area')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  battery_percent INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tourist_id UUID NOT NULL REFERENCES public.tourists(id) ON DELETE CASCADE,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('bronze', 'silver', 'gold')),
  code TEXT NOT NULL UNIQUE,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotels table
CREATE TABLE public.hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  rating DECIMAL(2, 1),
  price_range TEXT,
  amenities TEXT[],
  image_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'));
  
  -- Default role is tourist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'tourist');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User roles policies  
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tourists policies
CREATE POLICY "Users can view their own tourist profile" ON public.tourists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tourist profile" ON public.tourists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tourist profile" ON public.tourists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tourists" ON public.tourists
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Monuments policies (public read)
CREATE POLICY "Anyone can view monuments" ON public.monuments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage monuments" ON public.monuments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tickets policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = tickets.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Users can create their own tickets" ON public.tickets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = tickets.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = tickets.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Check-ins policies
CREATE POLICY "Users can view their own check-ins" ON public.check_ins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = check_ins.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Users can create check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = check_ins.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all check-ins" ON public.check_ins
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Tour guides policies
CREATE POLICY "Anyone can view verified guides" ON public.tour_guides
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Guides can view their own profile" ON public.tour_guides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create guide profile" ON public.tour_guides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guides can update their own profile" ON public.tour_guides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all guides" ON public.tour_guides
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guides" ON public.tour_guides
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Guide monuments policies
CREATE POLICY "Anyone can view guide monuments" ON public.guide_monuments
  FOR SELECT USING (true);

CREATE POLICY "Guides can manage their monuments" ON public.guide_monuments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tour_guides WHERE tour_guides.id = guide_monuments.guide_id AND tour_guides.user_id = auth.uid())
  );

-- Guide ratings policies
CREATE POLICY "Anyone can view ratings" ON public.guide_ratings
  FOR SELECT USING (true);

CREATE POLICY "Tourists can create ratings" ON public.guide_ratings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = guide_ratings.tourist_id AND tourists.user_id = auth.uid())
  );

-- SOS events policies
CREATE POLICY "Users can view their own SOS events" ON public.sos_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = sos_events.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Users can create SOS events" ON public.sos_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = sos_events.tourist_id AND tourists.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all SOS events" ON public.sos_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SOS events" ON public.sos_events
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Coupons policies
CREATE POLICY "Users can view their own coupons" ON public.coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tourists WHERE tourists.id = coupons.tourist_id AND tourists.user_id = auth.uid())
  );

-- Hotels policies (public read)
CREATE POLICY "Anyone can view hotels" ON public.hotels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage hotels" ON public.hotels
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for SOS events and check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;

-- Insert sample monuments data
INSERT INTO public.monuments (name, description, city, indian_price, foreign_price, latitude, longitude, image_url) VALUES
('Hawa Mahal', 'The Palace of Winds, iconic pink sandstone structure with 953 windows', 'Jaipur', 50, 200, 26.9239, 75.8267, NULL),
('Amber Fort', 'Majestic fort-palace complex overlooking Maota Lake', 'Jaipur', 100, 500, 26.9855, 75.8513, NULL),
('City Palace Jaipur', 'Royal residence with museums and stunning architecture', 'Jaipur', 75, 300, 26.9258, 75.8237, NULL),
('Mehrangarh Fort', 'One of the largest forts in India with stunning views', 'Jodhpur', 100, 600, 26.2985, 73.0188, NULL),
('Umaid Bhawan Palace', 'Art Deco palace and luxury hotel', 'Jodhpur', 100, 400, 26.2789, 73.0469, NULL),
('City Palace Udaipur', 'Palatial complex on the banks of Lake Pichola', 'Udaipur', 75, 300, 24.5764, 73.6893, NULL),
('Lake Palace', 'Floating palace on Lake Pichola', 'Udaipur', 50, 250, 24.5753, 73.6807, NULL),
('Jaisalmer Fort', 'Living fort with shops and hotels inside', 'Jaisalmer', 100, 500, 26.9124, 70.9128, NULL),
('Patwon Ki Haveli', 'Cluster of five grand havelis with intricate carvings', 'Jaisalmer', 50, 200, 26.9148, 70.9162, NULL),
('Ranthambore Fort', 'Ancient fort inside the famous tiger reserve', 'Sawai Madhopur', 75, 300, 26.0173, 76.4556, NULL);

-- Insert sample hotels data
INSERT INTO public.hotels (name, city, address, rating, price_range, amenities, latitude, longitude) VALUES
('Taj Rambagh Palace', 'Jaipur', 'Bhawani Singh Road', 4.9, '₹₹₹₹', ARRAY['Pool', 'Spa', 'Restaurant', 'WiFi'], 26.8989, 75.8049),
('ITC Rajputana', 'Jaipur', 'Palace Road', 4.7, '₹₹₹', ARRAY['Pool', 'Restaurant', 'WiFi', 'Gym'], 26.9125, 75.7873),
('Umaid Bhawan Palace', 'Jodhpur', 'Circuit House Road', 4.9, '₹₹₹₹', ARRAY['Pool', 'Spa', 'Restaurant', 'WiFi'], 26.2789, 73.0469),
('Taj Lake Palace', 'Udaipur', 'Lake Pichola', 4.9, '₹₹₹₹', ARRAY['Pool', 'Spa', 'Restaurant', 'WiFi'], 24.5753, 73.6807),
('The Oberoi Udaivilas', 'Udaipur', 'Haridasji Ki Magri', 4.9, '₹₹₹₹', ARRAY['Pool', 'Spa', 'Restaurant', 'WiFi'], 24.5669, 73.6763),
('Suryagarh', 'Jaisalmer', 'Kahala Phata', 4.8, '₹₹₹', ARRAY['Pool', 'Restaurant', 'WiFi', 'Desert Safari'], 26.8892, 70.8735),
('Hotel Narain Niwas Palace', 'Jaipur', 'Kanota Bagh', 4.5, '₹₹', ARRAY['Pool', 'Restaurant', 'WiFi', 'Garden'], 26.9089, 75.8234),
('Raas Jodhpur', 'Jodhpur', 'Tunvarji Ka Jhalra', 4.7, '₹₹₹', ARRAY['Pool', 'Spa', 'Restaurant', 'WiFi'], 26.2970, 73.0230);