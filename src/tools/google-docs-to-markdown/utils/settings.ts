import type { ConversionOptions } from '../types';
import { DEFAULT_OPTIONS } from '../types';

class SettingsManager {
  private storageKey = 'gdoc2md.options';
  private data: ConversionOptions = { ...DEFAULT_OPTIONS };

  get(key: keyof ConversionOptions): boolean {
    return this.data[key];
  }

  getAll(): ConversionOptions {
    return { ...this.data };
  }

  set(key: keyof ConversionOptions, value: boolean): void {
    this.data[key] = value;
    this.save();
  }

  setAll(newData: Partial<ConversionOptions>, save = true): void {
    Object.assign(this.data, newData);
    if (save) {
      this.save();
    }
  }

  toJSON(): ConversionOptions {
    return this.getAll();
  }

  save(): void {
    try {
      const serialized = JSON.stringify(this.data);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, serialized);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = window.localStorage.getItem(this.storageKey);
        if (serialized) {
          const parsed = JSON.parse(serialized);
          this.setAll(parsed, false);
        }
      }
    } catch (error) {
      console.warn('Error loading settings, using defaults:', error);
      this.data = { ...DEFAULT_OPTIONS };
    }
  }

  reset(): void {
    this.data = { ...DEFAULT_OPTIONS };
    this.save();
  }
}

export const settings = new SettingsManager();