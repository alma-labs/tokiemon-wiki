import { Community } from '../types';
import MonsterGrid from './MonsterGrid';

interface MonstersSectionProps {
  communities: Community[];
}

export default function MonstersSection({ communities }: MonstersSectionProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <MonsterGrid communities={communities} />
    </main>
  );
} 