// Utility to generate realistic footfall data for testing
import { supabase } from '@/integrations/supabase/client';

interface CheckInData {
  ticket_id: string;
  monument_id: string;
  tourist_id: string;
  check_in_time: string;
  latitude?: number;
  longitude?: number;
}

export async function generateRealisticFootfallData() {
  try {
    // Fetch all monuments
    const { data: monuments } = await supabase
      .from('monuments')
      .select('id, name, city, latitude, longitude, indian_price, foreign_price');

    if (!monuments || monuments.length === 0) {
      console.error('No monuments found');
      return;
    }

    // Fetch all tourists
    const { data: tourists } = await supabase
      .from('tourists')
      .select('id');

    if (!tourists || tourists.length === 0) {
      console.error('No tourists found. Please create tourist accounts first.');
      return;
    }

    // Fetch existing tickets
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id, monument_id, tourist_id, ticket_type, visit_date')
      .limit(1000);

    // If no tickets exist, create some for the data generation
    let tickets = existingTickets || [];
    if (tickets.length === 0) {
      console.log('No existing tickets found. Creating sample tickets...');
      const ticketsToCreate = [];
      
      for (let i = 0; i < Math.min(200, tourists.length * 2); i++) {
        const tourist = tourists[Math.floor(Math.random() * tourists.length)];
        const monument = monuments[Math.floor(Math.random() * monuments.length)];
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 30));
        
        ticketsToCreate.push({
          tourist_id: tourist.id,
          monument_id: monument.id,
          ticket_type: Math.random() > 0.7 ? 'foreign' : 'indian',
          visit_date: visitDate.toISOString().split('T')[0],
          qr_code: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          price: Math.random() > 0.7 ? monument.foreign_price || 200 : monument.indian_price || 50,
          is_used: false,
        });
      }

      const { data: newTickets, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketsToCreate)
        .select('id, monument_id, tourist_id, ticket_type, visit_date');

      if (ticketError) {
        console.error('Error creating tickets:', ticketError);
      } else if (newTickets) {
        tickets = newTickets;
        console.log(`Created ${newTickets.length} tickets`);
      }
    }

    const checkInsToInsert: CheckInData[] = [];
    const now = new Date();

    // Generate check-ins for the last 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      monuments.forEach((monument) => {
        // Different monuments have different popularity
        const popularityMultiplier = getPopularityMultiplier(monument.name);
        const dailyVisitors = Math.floor(Math.random() * (50 * popularityMultiplier) + (10 * popularityMultiplier));

        // Peak hours: 10 AM - 2 PM and 4 PM - 6 PM
        const peakHours = [10, 11, 12, 13, 14, 16, 17, 18];
        const offPeakHours = [6, 7, 8, 9, 15, 19, 20, 21];
        const nightHours = [22, 23, 0, 1, 2, 3, 4, 5];

        for (let i = 0; i < dailyVisitors; i++) {
          let hour: number;
          const rand = Math.random();

          if (rand < 0.5) {
            // 50% chance during peak hours
            hour = peakHours[Math.floor(Math.random() * peakHours.length)];
          } else if (rand < 0.8) {
            // 30% chance during off-peak
            hour = offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
          } else {
            // 20% chance during night (less likely)
            hour = nightHours[Math.floor(Math.random() * nightHours.length)];
          }

          const checkInTime = new Date(date);
          checkInTime.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

          // Find a ticket for this check-in
          // Try to find a ticket for this monument and date
          let ticket = tickets.find(
            t => t.monument_id === monument.id && 
            new Date(t.visit_date).toDateString() === date.toDateString()
          );

          // If not found, use any ticket for this monument
          if (!ticket) {
            ticket = tickets.find(t => t.monument_id === monument.id);
          }

          // If still not found, use any random ticket
          if (!ticket && tickets.length > 0) {
            ticket = tickets[Math.floor(Math.random() * tickets.length)];
          }

          if (ticket) {
            const tourist = tourists[Math.floor(Math.random() * tourists.length)];
            if (tourist) {
              checkInsToInsert.push({
                ticket_id: ticket.id,
                monument_id: monument.id,
                tourist_id: tourist.id,
                check_in_time: checkInTime.toISOString(),
                latitude: monument.latitude ? parseFloat(monument.latitude.toString()) : undefined,
                longitude: monument.longitude ? parseFloat(monument.longitude.toString()) : undefined,
              });
            }
          }
        }
      });
    }

    // Insert check-ins in batches
    const batchSize = 100;
    for (let i = 0; i < checkInsToInsert.length; i += batchSize) {
      const batch = checkInsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('check_ins')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(checkInsToInsert.length / batchSize)}`);
      }
    }

    console.log(`Generated ${checkInsToInsert.length} check-ins`);
    return checkInsToInsert.length;
  } catch (error) {
    console.error('Error generating footfall data:', error);
    throw error;
  }
}

function getPopularityMultiplier(monumentName: string): number {
  const name = monumentName.toLowerCase();
  
  // Very popular monuments
  if (name.includes('hawa mahal') || name.includes('amber fort') || name.includes('city palace')) {
    return 2.5;
  }
  
  // Popular monuments
  if (name.includes('mehrangarh') || name.includes('jaisalmer') || name.includes('udaipur')) {
    return 2.0;
  }
  
  // Moderately popular
  if (name.includes('ranthambore') || name.includes('umaid')) {
    return 1.5;
  }
  
  // Less popular
  return 1.0;
}

