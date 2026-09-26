import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChainService } from '../index.service';
import { ChainFormComponent } from './index.component';
describe('ChainFormComponent',()=>{let fixture:ComponentFixture<ChainFormComponent>;beforeEach(async()=>{await TestBed.configureTestingModule({imports:[ChainFormComponent],providers:[provideRouter([]),{provide:ChainService,useValue:{}}]}).compileComponents();fixture=TestBed.createComponent(ChainFormComponent);});it('shows transport fields only for transport stages',()=>{expect(fixture.componentInstance.isTransport).toBe(false);fixture.componentInstance.form.controls.stageType.setValue('TRANSPORT');expect(fixture.componentInstance.isTransport).toBe(true);});});
