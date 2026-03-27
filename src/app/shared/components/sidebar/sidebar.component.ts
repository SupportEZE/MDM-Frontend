import {
  Component,
  ViewChild,
  ElementRef,
  Renderer2,
  HostListener,
} from '@angular/core';
import { Menu, NavService } from '../../services/nav.service';
import { Subscription, fromEvent } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FORMIDCONFIG } from '../../../../config/formId.config';
import { ModuleDropdownComponent } from '../module-dropdown/module-dropdown.component';
@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  eventTriggered: boolean = false;
  scrolled: boolean = false;
  screenWidth!: number;
  public localdata = localStorage;
  public windowSubscribe$!: Subscription;
  options = { autoHide: false, scrollbarMinSize: 100 };
  public menuItems!: Menu[];
  public menuitemsSubscribe$!: Subscription;
  constructor(
    private navServices: NavService,
    public router: Router,
    public renderer: Renderer2,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
  ) {}

  clearNavDropdown() {
    this.menuItems?.forEach((a: any) => {
      a.active = false;
      a?.children?.forEach((b: any) => {
        b.active = false;
        b?.children?.forEach((c: any) => {
          c.active = false;
        });
      });
    });
  }
  ngOnInit() {
    let bodyElement: any = document.querySelector('.main-content');
    bodyElement.onclick = () => {
      if (
        localStorage.getItem('layoutStyles') == 'icon-click' ||
        localStorage.getItem('layoutStyles') == 'menu-click' ||
        localStorage.getItem('layoutStyles') == 'icon-hover' ||
        localStorage.getItem('data-nav-layout') == 'horizontal'
      ) {
        document
          .querySelectorAll('.main-menu .slide-menu.child1')
          .forEach((ele: any) => {
            ele.style.display = 'none';
          });
      }

      if (localStorage.getItem('layoutStyles') == 'icontext') {
        document.querySelector('html')?.removeAttribute('data-icon-text');
      }
    };

    this.navServices.loadModules();

    this.menuitemsSubscribe$ = this.navServices.items.subscribe((items) => {
      this.menuItems = items;
    });

    this.setNavActive(null, this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setNavActive(null, this.router.url);
      }
    });

    const WindowResize = fromEvent(window, 'resize');
    // subscribing the Observable
    if (WindowResize) {
      this.windowSubscribe$ = WindowResize.subscribe(() => {
        // to check and adjst the menu on screen size change
        // checkHoriMenu();
      });
    }

    if (
      document.querySelector('html')?.getAttribute('data-nav-layout') ==
        'horizontal' &&
      window.innerWidth >= 992
    ) {
      this.clearNavDropdown();
    }
  }
  // Start of Set menu Active event
  setNavActive(event: any, currentPath: string, menuData = this.menuItems) {
    if (event) {
      if (event?.ctrlKey) {
        return;
      }
    }
    let html = document.documentElement;
    if (
      html.getAttribute('data-nav-style') != 'icon-hover' &&
      html.getAttribute('data-nav-style') != 'menu-hover'
    ) {
      // if (!event?.ctrlKey) {
      for (const item of menuData) {
        if (item.path === currentPath) {
          item.active = true;
          item.selected = true;
          this.setMenuAncestorsActive(item);
        } else if (!item.active && !item.selected) {
          item.active = false; // Set active to false for items not matching the target
          item.selected = false; // Set active to false for items not matching the target
        } else {
          this.removeActiveOtherMenus(item);
        }
        if (item.children && item.children.length > 0) {
          this.setNavActive(event, currentPath, item.children);
        }
      }
      // }
    }
  }

  onMenuClick(event: MouseEvent, menuItem: any) {
    if (menuItem.action === 'DROPDOWN_CONFIG') {
      this.onDropdownConfigClick();
    } else {
      this.setNavActive(event, menuItem.path ?? '');
    }
  }

  getParentObject(obj: any, childObject: Menu) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (
          typeof obj[key] === 'object' &&
          JSON.stringify(obj[key]) === JSON.stringify(childObject)
        ) {
          return obj; // Return the parent object
        }
        if (typeof obj[key] === 'object') {
          const parentObject: any = this.getParentObject(obj[key], childObject);
          if (parentObject !== null) {
            return parentObject;
          }
        }
      }
    }
    return null; // Object not found
  }

  hasParent = false;
  hasParentLevel = 0;

  setMenuAncestorsActive(targetObject: Menu) {
    const parent = this.getParentObject(this.menuItems, targetObject);
    let html = document.documentElement;
    if (parent) {
      if (this.hasParentLevel >= 2) {
        this.hasParent = true;
      }
      parent.active = true;
      parent.selected = true;
      this.hasParentLevel += 1;
      this.setMenuAncestorsActive(parent);
    } else if (!this.hasParent) {
      this.hasParentLevel = 0;
      if (html.getAttribute('data-vertical-style') == 'doublemenu') {
        html.setAttribute('data-toggled', 'double-menu-close');
      }
    } else {
      this.hasParentLevel = 0;
      this.hasParent = false;
    }
  }
  removeActiveOtherMenus(item: any) {
    if (item) {
      if (Array.isArray(item)) {
        for (const val of item) {
          val.active = false;
          val.selected = false;
        }
      }
      item.active = false;
      item.selected = false;

      if (item.children && item.children.length > 0) {
        this.removeActiveOtherMenus(item.children);
      }
    } else {
      return;
    }
  }

  leftArrowFn() {
    const mainMenu: HTMLElement | null = document.querySelector('.main-menu');

    if (mainMenu) {
      mainMenu.scrollLeft -= 150; // adjust scroll amount if needed
    }
  }

  rightArrowFn() {
    const mainMenu: HTMLElement | null = document.querySelector('.main-menu');

    if (mainMenu) {
      mainMenu.scrollLeft += 150; // adjust value if needed
    }
  }

  // Start of Toggle menu event
  toggleNavActive(
    event: any,
    targetObject: Menu,
    menuData = this.menuItems,
    state?: any,
  ) {
    let html = document.documentElement;
    let element = event.target;
    if (
      (html.getAttribute('data-nav-style') != 'icon-hover' &&
        html.getAttribute('data-nav-style') != 'menu-hover') ||
      window.innerWidth < 992 ||
      (html.getAttribute('data-nav-layout') != 'horizontal' &&
        html.getAttribute('data-nav-style') != 'icon-hover-closed' &&
        html.getAttribute('data-nav-style') != 'menu-hover-closed')
    ) {
      for (const item of menuData) {
        if (item === targetObject) {
          if (
            html.getAttribute('data-vertical-style') == 'doublemenu' &&
            item.active &&
            window.innerWidth > 992 &&
            state
          ) {
            return;
          }
          item.active = !item.active;
          if (item.active) {
            this.closeOtherMenus(menuData, item);
          }
          this.setAncestorsActive(menuData, item);
        } else if (!item.active) {
          if (html.getAttribute('data-vertical-style') != 'doublemenu') {
            item.active = false; // Set active to false for items not matching the target
          }
        }
        if (item.children && item.children.length > 0) {
          this.toggleNavActive(event, targetObject, item.children);
        }
      }
      if (targetObject?.children && targetObject.active) {
        if (
          html.getAttribute('data-vertical-style') == 'doublemenu' &&
          html.getAttribute('data-toggled') != 'double-menu-open'
        ) {
          html.setAttribute('data-toggled', 'double-menu-open');
        }
      }

      if (
        element &&
        html.getAttribute('data-nav-layout') == 'horizontal' &&
        (html.getAttribute('data-nav-style') == 'menu-click' ||
          html.getAttribute('data-nav-style') == 'icon-click')
      ) {
        const listItem = element.closest('li');
        if (listItem) {
          // Find the first sibling <ul> element
          const siblingUL = listItem.querySelector('ul');
          let outterUlWidth = 0;
          let listItemUL = listItem.closest('ul:not(.main-menu)');
          while (listItemUL) {
            listItemUL = listItemUL.parentElement.closest('ul:not(.main-menu)');
            if (listItemUL) {
              outterUlWidth += listItemUL.clientWidth;
            }
          }
          if (siblingUL) {
            // You've found the sibling <ul> element
            let siblingULRect = listItem.getBoundingClientRect();
            if (html.getAttribute('dir') == 'rtl') {
              if (
                siblingULRect.left - siblingULRect.width - outterUlWidth + 150 <
                  0 &&
                outterUlWidth < window.innerWidth &&
                outterUlWidth + siblingULRect.width + siblingULRect.width <
                  window.innerWidth
              ) {
                targetObject.dirchange = true;
              } else {
                targetObject.dirchange = false;
              }
            } else {
              if (
                outterUlWidth + siblingULRect.right + siblingULRect.width + 50 >
                  window.innerWidth &&
                siblingULRect.right >= 0 &&
                outterUlWidth + siblingULRect.width + siblingULRect.width <
                  window.innerWidth
              ) {
                targetObject.dirchange = true;
              } else {
                targetObject.dirchange = false;
              }
            }
          }
          setTimeout(() => {
            let computedValue = siblingUL.getBoundingClientRect();
            if (computedValue.bottom > window.innerHeight) {
              siblingUL.style.height =
                window.innerHeight - computedValue.top - 8 + 'px !important';
              siblingUL.style.overflow = 'auto !important';
            }
          }, 100);
        }
      }
    } else {
      for (const item of menuData) {
        if (item === targetObject) {
          if (
            html.getAttribute('data-vertical-style') == 'doublemenu' &&
            item.active &&
            window.innerWidth > 992 &&
            state
          ) {
            return;
          }
          item.active = !item.active;
          if (item.active) {
            this.closeOtherMenus(menuData, item);
          }
          this.setAncestorsActive(menuData, item);
        }
      }
    }

    if (html.getAttribute('data-vertical-style') == 'icontext') {
      document.querySelector('html')?.setAttribute('data-icon-text', 'open');
    } else {
      document.querySelector('html')?.removeAttribute('data-icon-text');
    }
  }

  setAncestorsActive(menuData: Menu[], targetObject: Menu) {
    let html = document.documentElement;
    const parent = this.findParent(menuData, targetObject);

    if (parent) {
      parent.active = true;
      if (parent.active) {
        html.setAttribute('data-toggled', 'double-menu-open');
      }
      this.setAncestorsActive(menuData, parent);
    }
  }
  closeOtherMenus(menuData: Menu[], targetObject: Menu) {
    for (const item of menuData) {
      if (item !== targetObject) {
        item.active = false;
        if (item.children && item.children.length > 0) {
          this.closeOtherMenus(item.children, targetObject);
        }
      }
    }
  }
  findParent(menuData: Menu[], targetObject: Menu) {
    for (const item of menuData) {
      if (item.children && item.children.includes(targetObject)) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const parent: any = this.findParent(item.children, targetObject);
        if (parent) {
          return parent;
        }
      }
    }
    return null;
  }
  // End of Toggle menu event
  HoverToggleInnerMenuFn(event: Event, item: Menu) {
    let html = document.documentElement;
    let element = event.target as HTMLElement;
    if (
      element &&
      html.getAttribute('data-nav-layout') == 'horizontal' &&
      (html.getAttribute('data-nav-style') == 'menu-hover' ||
        html.getAttribute('data-nav-style') == 'icon-hover')
    ) {
      const listItem = element.closest('li');
      if (listItem) {
        // Find the first sibling <ul> element
        const siblingUL = listItem.querySelector('ul');
        let outterUlWidth = 0;
        let listItemUL: any = listItem.closest('ul:not(.main-menu)');
        while (listItemUL) {
          listItemUL = listItemUL.parentElement?.closest('ul:not(.main-menu)');
          if (listItemUL) {
            outterUlWidth += listItemUL.clientWidth;
          }
        }
        if (siblingUL) {
          // You've found the sibling <ul> element
          let siblingULRect = listItem.getBoundingClientRect();
        }
      }
    }
  }

  modalTitle = 'Dropdown Config';
  onDropdownConfigClick() {
    const dialogRef = this.dialog.open(ModuleDropdownComponent, {
      width: '650px',
      data: {
        call_as: 'modal',
        form_id: FORMIDCONFIG.ID.CUSTOMER,
        title: this.modalTitle,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
      }
    });
  }
}
