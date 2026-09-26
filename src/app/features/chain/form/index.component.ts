import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EnumSelectComponent } from '../../../shared/components/enum-select/index.component';
import { stageTypeSchema, transportModeSchema, fuelTypeSchema, calculationMethodSchema } from '../../traceability/index.schema';
import { ChainService } from '../index.service';
@Component({ selector: 'app-chain-form', imports: [ReactiveFormsModule, RouterLink, EnumSelectComponent], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ChainFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(ChainService); readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly stageTypes=stageTypeSchema.options; readonly transportModes=transportModeSchema.options; readonly fuelTypes=fuelTypeSchema.options; readonly calculationMethods=calculationMethodSchema.options;
  readonly saving=signal(false); readonly error=signal(''); readonly stageId=signal<number|null>(null);
  readonly form=this.fb.group({stageType:['',Validators.required],startedAt:['',Validators.required],endedAt:[''],originStreet:[''],originNumber:[''],originCity:[''],originState:[''],destinationStreet:[''],destinationNumber:[''],destinationCity:[''],destinationState:[''],transportMode:[''],distance:[0],fuelType:[''],capacity:[0],calculationMethod:['DEFRA',Validators.required]});
  get isTransport(): boolean { return this.form.controls.stageType.value==='TRANSPORT'; }
  submit(): void {
    if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); this.error.set(''); const v=this.form.getRawValue(); const id=Number(this.route.snapshot.paramMap.get('batchId'));
    const address=(prefix:'origin'|'destination')=>{const street=v[`${prefix}Street` as 'originStreet'] as string;return street?{street,number:v[`${prefix}Number` as 'originNumber'] as string,neighborhood:'',complement:'',zipCode:'',city:v[`${prefix}City` as 'originCity'] as string,state:v[`${prefix}State` as 'originState'] as string}:undefined;};
    this.service.createStage(id,{stageType:v.stageType as any,startedAt:v.startedAt!,endedAt:v.endedAt||undefined,originAddress:address('origin'),destinationAddress:address('destination')}).subscribe({next:(stage)=>{
      const saveEmission=()=>this.service.calculateEmission(stage.chainId,{calculationMethod:v.calculationMethod as any}).subscribe({next:()=>this.finish(id),error:()=>this.fail()});
      this.stageId.set(stage.chainId);
      if(this.isTransport){this.service.createTransport(stage.chainId,{transportMode:v.transportMode as any,distance:Number(v.distance),fuelType:v.fuelType as any,capacity:Number(v.capacity)}).subscribe({next:saveEmission,error:()=>this.fail()});}else saveEmission();
    },error:()=>this.fail()});
  }
  private finish(batchId:number):void{this.saving.set(false);this.router.navigate(['/batches',batchId,'stages']);}
  private fail():void{this.saving.set(false);this.error.set('Não foi possível registrar a etapa, transporte ou emissão. Confira os dados e tente novamente.');}
}
