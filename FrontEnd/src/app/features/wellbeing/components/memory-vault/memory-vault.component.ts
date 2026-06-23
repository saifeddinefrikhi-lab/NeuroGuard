import { Component, OnInit } from '@angular/core';

interface Memory {
  id: number;
  year: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'personal' | 'family' | 'travel';
}

interface FamilyMember {
  name: string;
  relation: string;
  image: string;
  bio: string;
}

interface MediaItem {
  id: number;
  title: string;
  artist: string;
  type: 'voice' | 'music';
  duration: string;
  isPlaying: boolean;
}

@Component({
  selector: 'app-memory-vault',
  standalone: false,
  templateUrl: './memory-vault.component.html',
  styleUrls: ['./memory-vault.component.scss']
})
export class MemoryVaultComponent implements OnInit {
  activeTab: 'timeline' | 'family' | 'media' = 'timeline';

  memories: Memory[] = [
    {
      id: 1,
      year: '1975',
      title: 'Our Wedding Day',
      description: 'A beautiful sunny afternoon in the garden. Everyone was so young and full of joy.',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800',
      category: 'personal'
    },
    {
      id: 2,
      year: '1982',
      title: 'First Family Road Trip',
      description: 'Drove all the way to the coast in the old blue station wagon. The kids sang the whole way.',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800',
      category: 'travel'
    },
    {
      id: 3,
      year: '1995',
      title: 'Sarah\'s Graduation',
      description: 'So proud to see our little girl walk across that stage. She always worked so hard.',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800',
      category: 'family'
    }
  ];

  family: FamilyMember[] = [
    {
      name: 'Eya',
      relation: 'Daughter / Caregiver',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
      bio: 'Always there with a warm smile and a helping hand.'
    },
    {
      name: 'Thomas',
      relation: 'Son',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
      bio: 'Living in the city but calls every Sunday morning.'
    },
    {
      name: 'Leo',
      relation: 'Grandson',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
      bio: 'Loves playing with his toy trains when he visits.'
    }
  ];

  media: MediaItem[] = [
    { id: 1, title: 'Morning Greeting', artist: 'from Eya', type: 'voice', duration: '0:45', isPlaying: false },
    { id: 2, title: 'What a Wonderful World', artist: 'Louis Armstrong', type: 'music', duration: '2:18', isPlaying: false },
    { id: 3, title: 'Happy Birthday Leo', artist: 'Family Recording', type: 'voice', duration: '1:12', isPlaying: false }
  ];

  constructor() { }

  ngOnInit(): void { }

  switchTab(tab: 'timeline' | 'family' | 'media') {
    this.activeTab = tab;
  }

  togglePlay(item: MediaItem) {
    this.media.forEach(m => {
      if (m.id !== item.id) m.isPlaying = false;
    });
    item.isPlaying = !item.isPlaying;
  }
}
