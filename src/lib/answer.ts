import type { Question } from "../data/types";

export function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function isCorrect(question: Question, value: string): boolean {
  return value.trim().toUpperCase() === choiceLetter(question.answer);
}

export function correctLetter(question: Question): string {
  return choiceLetter(question.answer);
}
