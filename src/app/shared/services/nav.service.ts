import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LOGIN_TYPES } from '../../utility/constants';
// Menu
export interface Menu {
  headTitle?: string;
  headTitle2?: string;
  path?: string;
  title?: string;
  icon?: string;
  type?: string;
  badgeValue?: string;
  badgeClass?: string;
  badgeText?: string;
  active?: boolean;
  selected?: boolean;
  bookmark?: boolean;
  children?: Menu[];
  children2?: Menu[];
  Menusub?: boolean;
  target?: boolean;
  menutype?: string;
  dirchange?: boolean;
  nochild?: any;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  modules: any = [];
  MENUITEMS: Menu[] = [];

  private unsubscriber: Subject<any> = new Subject();
  public screenWidth: BehaviorSubject<number> = new BehaviorSubject(
    window.innerWidth,
  );

  // Search Box
  public search = false;

  // Language
  public language = false;

  // Mega Menu
  public megaMenu = false;
  public levelMenu = false;
  public megaMenuColapse: boolean = window.innerWidth < 1199 ? true : false;

  // Collapse Sidebar
  public collapseSidebar: boolean = window.innerWidth < 991 ? true : false;

  // For Horizontal Layout Mobile
  public horizontal: boolean = window.innerWidth < 991 ? false : true;

  // Full screen
  public fullScreen = false;
  active: any;
  public items: BehaviorSubject<Menu[]> = new BehaviorSubject<Menu[]>(
    this.MENUITEMS,
  );

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
    const modulesString = localStorage.getItem('modules');
    this.modules = modulesString ? JSON.parse(modulesString) : null;
    // this.MENUITEMS = this.modules?.length ? this.modules : this.MENUITEMS;
    this.setScreenWidth(window.innerWidth);
    fromEvent(window, 'resize')
      .pipe(debounceTime(1000), takeUntil(this.unsubscriber))
      .subscribe((evt: any) => {
        this.setScreenWidth(evt.target.innerWidth);
        if (evt.target.innerWidth < 991) {
          this.collapseSidebar = true;
          this.megaMenu = false;
          this.levelMenu = false;
        }
        if (evt.target.innerWidth < 1199) {
          this.megaMenuColapse = true;
        }
      });
    if (window.innerWidth < 991) {
      // Detect Route change sidebar close
      this.router.events.subscribe((event) => {
        this.collapseSidebar = true;
        this.megaMenu = false;
        this.levelMenu = false;
      });
    }
  }

  ngOnDestroy() {
    this.unsubscriber.next(null);
    this.unsubscriber.complete();
  }

  loadModules(): void {
    const user = this.authService.getUser();
    console.log(user, 'user');

    this.MENUITEMS = [
      // Dashboard
      { headTitle: '' },
      {
        title: 'Business Partner',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="w-6 h-6 side-menu__icon" fill="currentColor"><path d="M40-160v-160q0-29 20.5-49.5T110-390h141q17 0 32.5 8.5T310-358q29 42 74 65t96 23q51 0 96-23t75-65q11-15 26-23.5t32-8.5h141q29 0 49.5 20.5T920-320v160H660v-119q-36 33-82.5 51T480-210q-51 0-97-18t-83-51v119H40Zm440-170q-35 0-67.5-16.5T360-392q-16-23-38.5-37T273-448q29-30 91-46t116-16q54 0 116.5 16t91.5 46q-26 5-48.5 19T601-392q-20 29-52.5 45.5T480-330ZM160-460q-45 0-77.5-32.5T50-570q0-46 32.5-78t77.5-32q46 0 78 32t32 78q0 45-32 77.5T160-460Zm640 0q-45 0-77.5-32.5T690-570q0-46 32.5-78t77.5-32q46 0 78 32t32 78q0 45-32 77.5T800-460ZM480-580q-45 0-77.5-32.5T370-690q0-46 32.5-78t77.5-32q46 0 78 32t32 78q0 45-32 77.5T480-580Z"></path></svg>`,
        type: 'sub',
        selected: false,
        active: false,
        dirchange: false,
        children: [
          ...(user?.login_type_id === LOGIN_TYPES.ORGANIZATION_ADMIN ||
          user?.login_type_id === LOGIN_TYPES.SALES_SUPPORT_USER ||
          user?.login_type_id === LOGIN_TYPES.SAP_USER
            ? [
                {
                  path: '/apps/invite/invite-list',
                  title: 'Invite',
                  type: 'link',
                  dirchange: false,
                },
              ]
            : []),
          {
            path: '/apps/customers/customer-list',
            title: 'Business Partner',
            type: 'link',
            dirchange: false,
          },
        ],
      },
      ...(user?.login_type_id === LOGIN_TYPES.ORGANIZATION_ADMIN ||
      user?.login_type_id === LOGIN_TYPES.SAP_USER
        ? [
            {
              icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>`,
              path: '/apps/master/user',
              title: 'User',
              type: 'link',
              dirchange: false,
              nochild: true,
            },
            {
              icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>`,
              // path: '/apps/master/user',
              title: 'Dropdown Config',
              type: 'link',
              dirchange: false,
              action: 'DROPDOWN_CONFIG',
              nochild: true,
            },
          ]
        : []),
    ];

    this.items.next(this.MENUITEMS);
    // this.modules = localModules || [];
    // this.MENUITEMS = [...this.modules];
    // this.items.next(this.MENUITEMS);
  }

  private setScreenWidth(width: number): void {
    this.screenWidth.next(width);
  }
  // MENUITEMS: Menu[] = this.modules

  // items = new BehaviorSubject<Menu[]>(this.MENUITEMS);
}
