// Utility functions for managing tour guides in localStorage

export interface Guide {
  id: string;
  userId: string;
  name: string;
  phone: string;
  languages: string[];
  hourlyRate: number;
  experienceYears: number;
  bio: string;
  monuments: string[]; // monument IDs
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  registrationDate: string;
  city?: string; // derived from monuments
}

const STORAGE_KEY = 'star_tour_guides';

// Get all guides from localStorage
export function getAllGuides(): Guide[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save guides to localStorage
function saveGuides(guides: Guide[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
}

// Add a new guide
export function addGuide(guide: Omit<Guide, 'id' | 'status' | 'verified' | 'registrationDate'>): Guide {
  const guides = getAllGuides();
  const newGuide: Guide = {
    ...guide,
    id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    verified: false,
    registrationDate: new Date().toISOString(),
  };
  guides.push(newGuide);
  saveGuides(guides);
  return newGuide;
}

// Update guide status
export function updateGuideStatus(guideId: string, status: 'approved' | 'rejected', verified: boolean): boolean {
  const guides = getAllGuides();
  const index = guides.findIndex(g => g.id === guideId);
  if (index === -1) return false;
  
  guides[index].status = status;
  guides[index].verified = verified;
  saveGuides(guides);
  return true;
}

// Get pending guides
export function getPendingGuides(): Guide[] {
  return getAllGuides().filter(g => g.status === 'pending');
}

// Get verified guides
export function getVerifiedGuides(): Guide[] {
  return getAllGuides().filter(g => g.verified === true && g.status === 'approved');
}

// Get guide by ID
export function getGuideById(guideId: string): Guide | undefined {
  return getAllGuides().find(g => g.id === guideId);
}

// Delete guide (for rejection)
export function deleteGuide(guideId: string): boolean {
  const guides = getAllGuides();
  const filtered = guides.filter(g => g.id !== guideId);
  if (filtered.length === guides.length) return false;
  saveGuides(filtered);
  return true;
}

