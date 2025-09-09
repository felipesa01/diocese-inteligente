import { AfterViewChecked, Component, Injectable, Renderer2, RendererFactory2, ViewChild } from '@angular/core';
import { ApisConectionService, mainAPIFileItem, objBodyUpdate, objGeneralToSpecific } from 'src/app/services/apis-conection.service';
import { GeoService } from 'src/app/services/geo.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbDateParserFormatter, NgbDateStruct, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom, of, take, Observable, filter } from 'rxjs';

import 'moment/min/locales';
import * as moment from 'moment';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';
import { PdfMakerService } from 'src/app/services/pdf-maker.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CarouselComponent } from './carousel/carousel.component';
import { AuthService } from 'src/app/services/auth.service';
import { flattenJSON } from 'three/src/animation/AnimationUtils';

moment.locale('pt-br');


/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = '/';

  parse(value: string): NgbDateStruct | null {
    if (value) {
      const date = value.split(this.DELIMITER);
      return {
        day: parseInt(date[0], 10),
        month: parseInt(date[1], 10),
        year: parseInt(date[2], 10),
      };
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    return date ? date.day + this.DELIMITER + date.month + this.DELIMITER + date.year : '';
  }
}


@Component({
  selector: 'app-modal-info-monitor-areas-publicas',
  templateUrl: './modal-info-monitor-areas-publicas.component.html',
  styleUrl: './modal-info-monitor-areas-publicas.component.css',
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ]
})
export class ModalInfoMonitorAreasPublicasComponent implements AfterViewChecked {

  mode: string;
  dataFromGeneral: objGeneralToSpecific;
  keys: string[];

  colorValues = {
    'A': '#8b8b8b',
    'B': '#dda252',
    'C': '#69ab6b',
    'D': '#4b87cf',
  }

  statusName = {
    0: 'Alerta identificado',
    1: 'Vistoriado',
    2: 'Deliberado',
    3: 'Encaminhado ao SisGEP',
    4: 'Arquivado sem SisGEP'
  }

  statusIndex = {
    'A': 0,
    'B': 1,
    'C': 3,
    'D': 4,
  }

  observacao_vistoria = [
    {
      id: "mov_terra",
      nome: "Movimentação de terra",
      value: false
    },
    {
      id: "sup_vegetacao",
      nome: "Supressão de vegetação",
      value: false
    },
    {
      id: "abertura_rua",
      nome: "Abertura de ruas",
      value: false
    },
    {
      id: "dep_material",
      nome: "Depósito de material",
      value: false
    },
    {
      id: "const_resid",
      nome: "Construção residencial",
      value: false
    },
    {
      id: "const_comerc",
      nome: "Construção comercial",
      value: false
    },
    {
      id: "const_nao_quali",
      nome: "Construção não qualificada",
      value: false
    },
    {
      id: "placa_vende",
      nome: "Placa de vende-se",
      value: false
    },
    {
      id: "sem_acesso",
      nome: "Sem acesso",
      value: false
    }
  ]

  isCollapsed = true;

  editMode: 'vistoria' | 'concluir' | undefined

  profileForm = this.formBuilder.group({
    data: new FormControl({}, { validators: Validators.required }),
    hora: new FormControl(undefined, { validators: Validators.required }),
    ocorrencia: new FormArray([]),
    obs: new FormControl(),
    anexos: new FormArray([]),
    concluido: new FormControl(),
    sisgep: new FormControl(),
    vist_resp: new FormControl(),
    vist_user: new FormControl(),
  })

  listaFotos: mainAPIFileItem[] = []

  get data() {
    return this.profileForm.get('data')
  }

  get hora() {
    return this.profileForm.get('hora')
  }

  get anexos() {
    return this.profileForm.get('anexos')
  }

  get vist_resp() {
    return this.profileForm.get('vist_resp')
  }

  get vist_user() {
    return this.profileForm.get('vist_user')
  }

  loading = false;

  @ViewChild(ToastContainerDirective)
  toastContainer: ToastContainerDirective;

  private renderer: Renderer2;
  constructor(private geoservice: GeoService, private formBuilder: FormBuilder, private http: HttpClient, private apiConection: ApisConectionService, private toastr: ToastrService, private pdfMaker: PdfMakerService, private dialog: MatDialog, private authService: AuthService, rendererFactory: RendererFactory2) {

    this.renderer = rendererFactory.createRenderer(null, null);
  }

  ngAfterViewChecked(): void {
    // this.toastr.overlayContainer = this.toastContainer;
  }

  setDataFromGeneral(e: objGeneralToSpecific) {
    this.dataFromGeneral = e;
    // console.log('e', e)
    this.mode = e.typeMode;

    this.setPhotos();

    if (this.mode == 'info') {
      const removeKeys = ['status', 'status_', 'sisgep', 'vistoriado', 'concluido', 'id_setor'];
      this.keys = Object.keys(this.dataFromGeneral.dataOrForm).filter(e => !removeKeys.includes(e));
    }
    else if (this.mode == 'edit') {
      this.setDateTimeControl();
      this.setOcorrencia();
      this.setObs();
      this.setConcluidoESisgep();
      this.setUserVistoria();
    }
  }

  setUserVistoria() {
    const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
    // console.log('mainForm', mainForm)
    
    var valueResp = mainForm.get('vist_resp').value['value']['main'];
    this.profileForm.get('vist_resp').setValue(valueResp as never);

    var valueUser = mainForm.get('vist_user').value['value']['main'];
    this.profileForm.get('vist_user').setValue(valueUser as never);
  }


  setConcluidoESisgep() {
    const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
    var valueConcluido = mainForm.get('concluido').value['value']['main']
    this.profileForm.get('concluido').setValue(valueConcluido);

    var valueSisgep = mainForm.get('sisgep').value['value']['main'];
    var sisgepfinal = ''
    if (valueSisgep != '' && valueSisgep) {
      for (let i = 0; i <= 13; i += 3) {
        sisgepfinal += valueSisgep.slice(i, i + 3);
        if (i <= 9 && i + 3 < valueSisgep.length) {
          sisgepfinal = `${sisgepfinal}.`
        }
      }
    }

    this.profileForm.get('sisgep').setValue(sisgepfinal);
    this.isCollapsed = sisgepfinal == '' ? true : false
  }

  async setPhotos() {
    var valueList: number[] = []
    if (this.mode == 'edit') {
      const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
      valueList = mainForm.get('vist_idimg').value['value']['main'];
    }
    else if (this.mode == 'info') {
      valueList = this.dataFromGeneral.dataFull['vist_idimg']['valor'];
    }

    if (valueList && valueList.length > 0) {
      await Promise.all(valueList.map(async id => {
        var data = await lastValueFrom(this.apiConection.getFile(id, true));
        this.listaFotos.push(data);
      }))
    }
  }

  async setPhotoConteudo(id: number) {
    var file = this.listaFotos.filter(e => e.ID_Arquivo == id)[0];
    if (file) {
      if (!file.BIN_Arquivo) {
        file.BIN_Arquivo = (await lastValueFrom(this.apiConection.getFile(id, true))).BIN_Arquivo;
      }
    }
  }


  removePhoto(id: number) {
    this.listaFotos = this.listaFotos.filter(e => e.ID_Arquivo != id);
  }


  openCarousel(openedFileID: number | null = 0) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.hasBackdrop = true;
    dialogConfig.panelClass = 'carousel-photos'


    var idxToOpen: string
    if (!openedFileID) {
      idxToOpen = '0'
    }
    else {
      idxToOpen = this.listaFotos.findIndex(e => e.ID_Arquivo == openedFileID).toString()
    }

    if (openedFileID) {
      dialogConfig.data = { data: this.listaFotos.filter(e => e.ID_Arquivo == openedFileID), idxOpened: idxToOpen };
    }
    else {
      this.listaFotos.sort((a, b) => a.NM_Arquivo.localeCompare(b.NM_Arquivo))
      dialogConfig.data = { data: this.listaFotos, idxOpened: idxToOpen };
    }


    if (this.listaFotos.length > 0) {
      var dialog = this.dialog.open(CarouselComponent, dialogConfig);
      dialog.afterOpened().pipe(take(1)).subscribe(_ => {
        this.modalToTop()
      })
    }
    else {
      console.log('Não vai abrir')
    }
  }

  modalToTop() {
    const elements = Array.from(document.getElementsByClassName('cdk-global-overlay-wrapper'));
    var filtered = elements.filter(e => Array.from(e.children).some(z => Array.from(z.classList).includes('carousel-photos')))[0];
    const backdrop = Array.from(document.getElementsByClassName('cdk-overlay-backdrop'))[0];
    filtered.parentNode.insertBefore(backdrop, null);
    filtered.parentNode.insertBefore(filtered, null);
  }

  setObs() {
    const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
    var value = mainForm.get('vist_obs').value['value']['main']
    this.profileForm.get('obs').setValue(value);
  }

  setOcorrencia() {
    const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
    var values = mainForm.get('vist_class').value['value']['main'];

    if (values) {
      var finalValues = values.map(e => this.observacao_vistoria.filter(i => i.nome == e)[0].id);
      finalValues.forEach(e => {
        var selected = this.observacao_vistoria.filter(i => i.id == e)[0]
        if (selected) {
          selected.value = true;
        }
      })
    }
  }

  setDateTimeControl() {
    const mainForm = this.dataFromGeneral.dataOrForm as FormGroup<any>;
    var dataMoment: moment.Moment = moment(mainForm.get('vist_datah').value['value']['main'], "DD/MM/YYYY hh:mm:ss");
    this.profileForm.get('data').setValue({ day: Number(dataMoment.format('DD')), month: Number(dataMoment.format('MM')), year: Number(dataMoment.format('YYYY')) })
    this.profileForm.get('hora').setValue({ hour: Number(dataMoment.format('hh')), minute: Number(dataMoment.format('mm')), second: Number(dataMoment.format('ss')) })
  }

  checkstep(n: number) {
    if (n == 0) { return true; }
    var number = this.statusIndex[this.dataFromGeneral.dataOrForm['status_'][0]]

    if (number >= n) {
      if (this.dataFromGeneral.dataOrForm['status_'] == 'D0' && n == 3) { return false; }
      return true;
    }
  }

  abortEdit() {
    if (this.editMode) {
      this.editMode = undefined;
    }
    else {
      this.geoservice.openGeneralFeatureInfo(this.dataFromGeneral.dataFull.data, this.dataFromGeneral.dataFull.zoomToFeature, 'info')
    }
  }

  setEditMode(mode: 'vistoria' | 'concluir') {
    this.editMode = mode
  }

  onCheckChange(event) {
    const formArray: FormArray = this.profileForm.get('ocorrencia') as FormArray;

    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(event.target.value));
    }
    /* unselected */
    else {
      // find the unselected element
      let i: number = 0;

      formArray.controls.forEach((ctrl: FormControl) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }

        i++;
      });
    }
  }

  onCheckChange_beta(event) {
    this.observacao_vistoria.filter(e => e.id == event.target.id)[0].value = event.target.checked;
  }


  fileName = '';
  onFileSelected(event) {
    const formArray: FormArray = this.profileForm.get('anexos') as FormArray;
    var fileList = event.target.files as FileList

    for (var i = 0; i < fileList.length; i++) {
      var item = fileList.item(i);
      if (item.type != 'image/png' && item.type != 'image/jpeg') {
        this.profileForm.controls.anexos.setErrors({ customError: true });
        this.profileForm.controls.anexos.markAsTouched();
        break
      }
      else {
        this.profileForm.controls.anexos.setErrors(null);
        this.profileForm.controls.anexos.markAsUntouched();
        formArray.push(new FormControl(item))
      }
    }
  }


  setDateTimeString(data: NgbDateStruct, time: NgbTimeStruct): string {
    return `${data.month}/${data.day}/${data.year} ${time.hour}:${time.minute}:00`
  }

  async onSubmitConcluir() {

    var userName: string | any[] = await lastValueFrom(this.authService.getUserInfo());
    userName = userName[0]['NM_Usuario'] as string;

    if (this.profileForm.valid) {
      this.loading = true;

      var fields = [
        {
          name: "concluido",
          value: 'true'
        },
        {
          name: "conc_data",
          value: moment().format("MM/DD/YYYY hh:mm:ss")
        },
        {
          name: 'conc_user',
          value: userName
        }]

      var sisgepFinal = this.profileForm.get('sisgep').value.trim().replaceAll('.', '').replaceAll(',', '');

      if (!this.isCollapsed) {
        fields.push({
          name: "sisgep",
          value: sisgepFinal
        })
      }
      else {
        fields.push({
          name: "sisgep",
          value: null
        })
      }

      var dataBody: objBodyUpdate = {
        gid: Number(this.dataFromGeneral.dataFull.data.layerId),
        identifierName: this.dataFromGeneral.dataFull.data.pk_name,
        identifierValue: this.dataFromGeneral.dataFull.data.pk_value.toString(),
        fields: fields
      }

      var result = await lastValueFrom(this.apiConection.updateAttibutesPG(dataBody))
      this.openToastSuccess('Alterações salvas com sucesso!', 'edit');
      this.loading = false;

    } else {
      // Form is invalid, trigger validation messages
      Object.values(this.profileForm.controls).forEach(control => control.markAsTouched());
    }

  }

  async updateFiles(files: File[]): Promise<number[]> {

    const blobToBase64 = async blob => {
      return new Promise<string | ArrayBuffer>((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result)
        reader.onerror = err => reject(err)
        reader.readAsDataURL(blob)
      })
    }

    var idsFiles: number[] = [];
    await Promise.all(
      files.map(async (file: File) => {
        var imageBase64 = await blobToBase64(file) as string
        var base64data = imageBase64.slice(imageBase64.indexOf(',') + 1)

        var idFile = await lastValueFrom(this.apiConection.sendFile(base64data, file.name));
        if (idFile.length > 0) {
          idsFiles.push(idFile[0])
        }
      }))

    return idsFiles
  }


  async onSubmitVistoria() {
    if (this.profileForm.valid) {

      var userName = await lastValueFrom(this.authService.getUserInfo());
      userName = userName[0]['NM_Usuario'];
      // console.log('userName', userName)      

      this.loading = true;

      var newIdsFiles = await this.updateFiles(this.profileForm.get('anexos').value);

      var idsFiles = this.listaFotos.map(e => e.ID_Arquivo);

      newIdsFiles.forEach(e => {
        if (!idsFiles.includes(e)) {
          idsFiles.push(e)
        }
      });

      var dataBody: objBodyUpdate = {
        gid: Number(this.dataFromGeneral.dataFull.data.layerId),
        identifierName: this.dataFromGeneral.dataFull.data.pk_name,
        identifierValue: this.dataFromGeneral.dataFull.data.pk_value.toString(),
        fields: [
          {
            name: "vistoriado",
            value: 'true'
          },
          {
            name: "vist_datah",
            value: this.setDateTimeString(this.profileForm.get('data').value as NgbDateStruct, this.profileForm.get('hora').value as NgbTimeStruct)
          },
          {
            name: "vist_class",
            value: `[${this.observacao_vistoria.filter(e => e.value).map(e => "'" + e.nome + "'").join(',')}]`
          },
          {
            name: "vist_obs",
            value: this.profileForm.get('obs').value
          },
          {
            name: "vist_idimg",
            value: `[${idsFiles.join(',')}]`
          },
          {
            name: "vist_resp",
            value: this.profileForm.get('vist_resp').value
          },
          {
            name: "vist_user",
            value: userName
          }]
      }

      var result = await lastValueFrom(this.apiConection.updateAttibutesPG(dataBody))
      this.openToastSuccess('Alterações salvas com sucesso!', 'edit');
      this.loading = false;

    } else {
      // Form is invalid, trigger validation messages
      Object.values(this.profileForm.controls).forEach(control => control.markAsTouched());
    }

  }


  isVistoriado() {
    if (this.mode == 'info') {
      console.log('ver aqui!!')
    }
    else if (this.mode == 'edit') {
      return (this.dataFromGeneral.dataOrForm as FormGroup<any>).get('vistoriado').value['value']['main'] as boolean
    }
    else {
      console.log('Atenção aqui!')
    }
  }

  isConcluido() {
    if (this.mode == 'info') {
      console.log('ver aqui!!')
    }
    else if (this.mode == 'edit') {
      return (this.dataFromGeneral.dataOrForm as FormGroup<any>).get('concluido').value['value']['main'] as boolean
    }
    else {
      console.log('Atenção aqui!')
    }
  }

  async removeVistoria() {

    this.loading = true;
    var dataBody: objBodyUpdate = {
      gid: Number(this.dataFromGeneral.dataFull.data.layerId),
      identifierName: this.dataFromGeneral.dataFull.data.pk_name,
      identifierValue: this.dataFromGeneral.dataFull.data.pk_value.toString(),
      fields: [
        {
          name: "vistoriado",
          value: 'false'
        },
        {
          name: "vist_datah",
          value: null
        },
        {
          name: "vist_class",
          value: null
        },
        {
          name: "vist_obs",
          value: null
        },
        {
          name: "vist_idimg",
          value: null
        },
        {
          name: "vist_user",
          value: null
        },
        {
          name: "vist_resp",
          value: null
        }]
    }

    var result = await lastValueFrom(this.apiConection.updateAttibutesPG(dataBody))
    this.openToastSuccess('Alterações salvas com sucesso!', 'edit');
    this.loading = false;
  }


  async removeConcluido() {
    this.loading = true;
    var dataBody: objBodyUpdate = {
      gid: Number(this.dataFromGeneral.dataFull.data.layerId),
      identifierName: this.dataFromGeneral.dataFull.data.pk_name,
      identifierValue: this.dataFromGeneral.dataFull.data.pk_value.toString(),
      fields: [
        {
          name: "concluido",
          value: 'false'
        },
        {
          name: "sisgep",
          value: null
        },
        {
          name: "conc_user",
          value: null
        }]
    }

    var result = await lastValueFrom(this.apiConection.updateAttibutesPG(dataBody))
    this.openToastSuccess('Alterações salvas com sucesso!', 'edit');
    this.loading = false;

  }

  openToastSuccess(mensage: string, modeOfGeneralToOpen: string) {
    this.toastr.success(mensage, undefined, { progressBar: true, timeOut: 2000, positionClass: 'toast-bottom-center' }).onHidden.pipe(take(1)).subscribe(e => {
      this.geoservice.openGeneralFeatureInfo(this.dataFromGeneral.dataFull.data, this.dataFromGeneral.dataFull.zoomToFeature, modeOfGeneralToOpen);
      this.geoservice.refreshMap();
    })
  }

  get vist_class() {
    return this.dataFromGeneral.dataOrForm['vist_class'] ? this.dataFromGeneral.dataOrForm['vist_class'] : []
  }

  get vistClass_text() {
    if (this.vist_class.length <= 1) {
      return this.vist_class.join('');
    }
    return `${this.vist_class.slice(0, -1).join(', ')} e ${this.vist_class.slice(-1)}`;
  }

  get vist_obs() {
    return this.dataFromGeneral.dataOrForm['vist_obs'] ? this.dataFromGeneral.dataOrForm['vist_obs'] : ''
  }

  isExpanded: boolean = false;
  maxLength: number = 100;
  get displayedText() {
    if (this.dataFromGeneral.dataOrForm['vist_obs']) {
      if (this.isExpanded || this.dataFromGeneral.dataOrForm['vist_obs'].length <= this.maxLength) {
        return this.dataFromGeneral.dataOrForm['vist_obs'];
      } else {
        return this.dataFromGeneral.dataOrForm['vist_obs'].substring(0, this.maxLength) + '...';
      }
    }
    else {
      return null
    }
  }

  get buttonText() {
    return this.isExpanded ? 'Reduzir' : 'Expandir';
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }


  doPdfMaker() {
    this.pdfMaker.makeTestPDF()
  }


  mayEditVistoria() {
    var telasCamada = this.geoservice.layerList.filter(z => z.get('fonteGS_front') == this.dataFromGeneral.layerSource)[0].get('telas_gsu')
    var selectedTela = this.authService.telasGSU.filter(z => telasCamada.includes(z.DS_Tela))[0]
    if (selectedTela.IC_Incluir == 'S') {
      return true
    }
    else {
      return false
    }
  }

  mayEditConclusao() {
    var telasCamada = this.geoservice.layerList.filter(z => z.get('fonteGS_front') == this.dataFromGeneral.layerSource)[0].get('telas_gsu')
    var selectedTela = this.authService.telasGSU.filter(z => telasCamada.includes(z.DS_Tela))[0]
    if (selectedTela.IC_Gerar == 'S') {
      return true
    }
    else {
      return false
    }
  }

}
