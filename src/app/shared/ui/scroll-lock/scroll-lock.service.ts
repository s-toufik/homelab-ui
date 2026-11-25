import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private count = 0;
  private scrollY = 0;

  lock(): void {
    if (this.count === 0) {
      this.scrollY = window.scrollY;
      const style = document.body.style;
      style.position = 'fixed';
      style.top = `-${this.scrollY}px`;
      style.left = '0';
      style.right = '0';
      style.overflow = 'hidden';
    }
    this.count++;
  }

  unlock(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      const style = document.body.style;
      style.position = '';
      style.top = '';
      style.left = '';
      style.right = '';
      style.overflow = '';
      window.scrollTo(0, this.scrollY);
    }
  }
}
