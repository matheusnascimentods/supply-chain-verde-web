import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../../../signup';

@Component({
  selector: 'app-landing',
  imports: [NgOptimizedImage, RouterLink, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {}
