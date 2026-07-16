/**
 * Content packs — versioned JSON corpora for drills.
 * Users can later import custom packs; registry keeps them modular.
 */

import wordsEn from '../../../assets/content/words-en.json';
import samasyaPrompts from '../../../assets/content/samasya-prompts.json';
import verses from '../../../assets/content/verses.json';
import puranaQuiz from '../../../assets/content/purana-quiz.json';

export interface WordPack {
  id: string;
  version: number;
  language: string;
  words: string[];
}

export interface SamasyaItem {
  lastLine: string;
  hint: string;
}

export interface SamasyaPack {
  id: string;
  version: number;
  language: string;
  items: SamasyaItem[];
}

export interface VerseItem {
  id: string;
  title: string;
  language: string;
  lines: string[];
  translation: string;
}

export interface VersePack {
  id: string;
  version: number;
  language: string;
  items: VerseItem[];
}

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answer: number;
  topic: string;
}

export interface QuizPack {
  id: string;
  version: number;
  language: string;
  items: QuizItem[];
}

const wordPacks = new Map<string, WordPack>();
const samasyaPacks = new Map<string, SamasyaPack>();
const versePacks = new Map<string, VersePack>();
const quizPacks = new Map<string, QuizPack>();

export function registerWordPack(pack: WordPack): void {
  wordPacks.set(pack.id, pack);
}

export function registerSamasyaPack(pack: SamasyaPack): void {
  samasyaPacks.set(pack.id, pack);
}

export function registerVersePack(pack: VersePack): void {
  versePacks.set(pack.id, pack);
}

export function registerQuizPack(pack: QuizPack): void {
  quizPacks.set(pack.id, pack);
}

export function getWordPack(id = 'words-en'): WordPack {
  const pack = wordPacks.get(id);
  if (!pack) throw new Error(`Word pack not found: ${id}`);
  return pack;
}

export function getSamasyaPack(id = 'samasya-prompts'): SamasyaPack {
  const pack = samasyaPacks.get(id);
  if (!pack) throw new Error(`Samasya pack not found: ${id}`);
  return pack;
}

export function getVersePack(id = 'verses-classic'): VersePack {
  const pack = versePacks.get(id);
  if (!pack) throw new Error(`Verse pack not found: ${id}`);
  return pack;
}

export function getQuizPack(id = 'purana-quiz-lite'): QuizPack {
  const pack = quizPacks.get(id);
  if (!pack) throw new Error(`Quiz pack not found: ${id}`);
  return pack;
}

/** Boot-time registration of shipped packs */
export function loadBuiltinContent(): void {
  registerWordPack(wordsEn as WordPack);
  registerSamasyaPack(samasyaPrompts as SamasyaPack);
  registerVersePack(verses as VersePack);
  registerQuizPack(puranaQuiz as QuizPack);
}

export function listWordPacks(): WordPack[] {
  return Array.from(wordPacks.values());
}

export function listSamasyaPacks(): SamasyaPack[] {
  return Array.from(samasyaPacks.values());
}

export function listVersePacks(): VersePack[] {
  return Array.from(versePacks.values());
}

export function listQuizPacks(): QuizPack[] {
  return Array.from(quizPacks.values());
}
