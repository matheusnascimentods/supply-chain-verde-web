import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../../core/auth/session/index.service';
import { UsersService } from '../../users/index.service';
import { ChainService } from '../index.service';
import { ChainFormComponent } from './index.component';

describe('ChainFormComponent', () => {
  let fixture: ComponentFixture<ChainFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainFormComponent],
      providers: [
        provideRouter([]),
        { provide: ChainService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: SessionService, useValue: { role: () => 'supplier' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChainFormComponent);
  });

  it('shows transport fields only for transport stages', () => {
    expect(fixture.componentInstance.isTransport).toBe(false);
    fixture.componentInstance.form.controls.stageType.setValue('TRANSPORT');
    expect(fixture.componentInstance.isTransport).toBe(true);
  });
});
