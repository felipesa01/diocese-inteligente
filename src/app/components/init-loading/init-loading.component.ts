import { AfterContentInit, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-init-loading',
  standalone: true,
  imports: [],
  templateUrl: './init-loading.component.html',
  styleUrl: './init-loading.component.css'
})
export class InitLoadingComponent implements AfterContentInit {

  constructor(private authServce: AuthService, private route: Router) {

  }
  ngAfterContentInit(): void {
    console.log('Início!')

    setTimeout(() => {
      console.log('Fim!')
      this.route.navigate(['/map'], {skipLocationChange: true})
    }, 1)

  }

}
