import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { CryptoService } from '../crypto/crypto.service';
import { UtilService } from '../../../utility/util.service';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { API_TYPE } from '../../../utility/constants';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  encrypt: boolean = false;
  canActive: boolean = false;
  disabled: boolean = false;
  isDuplicate: boolean = false;
  userData: any = {};
  navApi: any;

  //-----For local----//
  // Lal`s Ip
  // public rootUrl = 'http://192.168.0.108:9001/';
  // public baseUrl  ='http://192.168.0.108:9001/eurobond/';

  
      public rootUrl = 'https://docker.ezeone.tech/';
      public upload = 'https://docker.ezeone.tech';
      public baseUrl = 'https://docker.ezeone.tech/api/';
      public authUrl = 'https://docker.ezeone.tech/api/auth/';
      public adminUrl = 'https://docker.ezeone.tech/api/';
      public webSocketUrl = 'https://docker.ezeone.tech';
  // public rootUrl = 'https://ozonemdmdev.ezeone.tech/ozonemdm/';
  // public upload = 'https://ozonemdmdev.ezeone.tech';
  // public baseUrl = 'https://mgvrz3tb-9006.inc1.devtunnels.ms/api/';
  // public authUrl = 'https://mgvrz3tb-9006.inc1.devtunnels.ms/api/auth/';
  // public adminUrl = 'https://mgvrz3tb-9006.inc1.devtunnels.ms/api/';
  // public webSocketUrl = 'https://ozonemdmdev.ezeone.tech';

  constructor(
    private http: HttpClient,
    public crypto: CryptoService,
    public toastr: ToastrServices,
    private utilService: UtilService,
  ) {}

  public configMap = {
    org: {
      org_name: 'Timex Bond',
      title: 'Smart Solutions for Smart People',
      sub_title: 'Smart Solutions for Smart People',
      website_url: 'https://timexbond.com/',
      play_store_link: 'https://timexbond.com/',
      app_store_link: 'https://timexbond.com/',
    },
    social: [
      {
        title: 'Facebook',
        social_url: 'https://www.facebook.com/timexbond.official',
      },
      {
        title: 'Instagram',
        social_url: 'https://www.instagram.com/timexbond.official/',
      },
      {
        title: 'Linkedin',
        social_url: 'https://www.linkedin.com/company/timex-bond/',
      },
    ],
  };

  // Method to set headers with token
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  }

  // GET method
  get(endpoint: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.get(url, { headers: this.getHeaders() }).pipe(
      map((result: any) => {
        const decrypt = this.crypto.decryptData(JSON.stringify(result));
        return decrypt;
      }),
    );
  }

  // POST method
  post(body: any, endpoint: string, urlType?: string): Observable<any> {
    const url = `${urlType === API_TYPE.AUTH ? this.authUrl : this.baseUrl}${endpoint}`;
    const isEncryptionEnabled = this.encrypt === true;
    const requestBody = isEncryptionEnabled
      ? this.crypto.encryptData(body)
      : body;
    const headers = this.getHeaders();

    return this.http.post(url, requestBody, { headers }).pipe(
      map((result: any) => {
        if (isEncryptionEnabled) {
          try {
            return this.crypto.decryptData(result);
          } catch (e) {
            console.error('Decryption error:', e);
            throw new Error('Failed to decrypt response data.');
          }
        } else {
          return result;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.disabled = false;
        const errorMessage = this.utilService.handleApiError(error);
        this.toastr.error(errorMessage, '', 'toast-top-right');
        return of(error);
      }),
    );
  }

  // PATCH method

  patch(body: any, endpoint: string): Observable<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const isEncryptionEnabled = this.encrypt === true;

    const requestBody = isEncryptionEnabled
      ? { encryptedData: this.crypto.encryptData(body) }
      : body;

    const headers = this.getHeaders();

    return this.http.patch(url, requestBody, { headers }).pipe(
      map((result: any) => {
        if (isEncryptionEnabled) {
          try {
            return this.crypto.decryptData(result);
          } catch (e) {
            console.error('Decryption error:', e);
            throw new Error('Failed to decrypt response data.');
          }
        } else {
          return result;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.disabled = false;
        const errorMessage = this.utilService.handleApiError(error);
        this.toastr.warning(errorMessage, '', 'toast-top-right');
        return of(error);
      }),
    );
  }

  private getHeadersWithoutContentType(): HttpHeaders {
    const headers = this.getHeaders();
    return headers.delete('Content-Type'); // Let Angular set it automatically
  }
  uploadFile(formData: FormData, endpoint: string): Observable<any> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .post(url, formData, {
        headers: this.getHeadersWithoutContentType(), // Remove Content-Type manually
      })
      .pipe(
        map((result: any) => result),
        catchError((error: HttpErrorResponse) => {
          this.disabled = false;
          let errorMessage = this.utilService.handleApiError(error);
          this.toastr.error(errorMessage, '', 'toast-top-right');
          return of(error);
        }),
      );
  }

  async getForms(id: any): Promise<any> {
    let data: any = localStorage.getItem('formBuilder');
    data = data ? JSON.parse(data) : [];
    return data.find((row: any) => row.form_id === id) || null;
  }
}
