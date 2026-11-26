import { Component, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { ScrollLockDirective } from '@shared/ui/scroll-lock/scroll-lock.directive';

@Component({
  selector: 'app-session-expired',
  imports: [ScrollLockDirective],
  templateUrl: './session-expired.html',
  styleUrl: './session-expired.scss',
})
export class SessionExpired {
  protected readonly session = inject(GatewaySession);
}
