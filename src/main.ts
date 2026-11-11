import { provideHttpClient, withFetch } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { appConfig } from './app/app-config';
import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/home.component';

const routes: Routes = appConfig.githubPages
  ? [{ path: '**', redirectTo: '' }]
  : [
      { path: 'admin', loadComponent: () => import('./app/admin.component').then(({ AdminComponent }) => AdminComponent) },
      { path: '', component: HomeComponent },
      { path: '**', redirectTo: '' }
    ];

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(withFetch()), provideRouter(routes)]
}).catch((error: unknown) => console.error('Application bootstrap failed.', error));
