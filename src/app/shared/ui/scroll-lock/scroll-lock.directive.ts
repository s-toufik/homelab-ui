import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { ScrollLockService } from './scroll-lock.service';

@Directive({ selector: '[appScrollLock]' })
export class ScrollLockDirective implements OnInit, OnDestroy {
  private readonly scrollLock = inject(ScrollLockService);

  ngOnInit(): void {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }
}
