import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import confetti from 'canvas-confetti';

@Component({
  selector: 'app-thank-you',
  imports: [CommonModule],
  templateUrl: './thank-you.component.html',
  styleUrls: ['./thank-you.component.scss'],
})
export class ThankYouComponent {
  header: string = '';
  msg: string = '';
  lastPage: any = '';
  orgId: any = '';
  backgroundImage: string = '';
  orgThemeBg: string = '#152a59';
  // orgThemeBg:string="#9f212e"
  bgColorOption: any = { 3: '#9f212e', 6: '#124479' };
  private count = 200;
  private defaults = {
    origin: { y: 0.7 },
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.lastPage = this.route.snapshot.paramMap.get('type') || '';
    this.orgId = this.route.snapshot.paramMap.get('orgId') || '';
    this.backgroundImage = 'assets/images/other-images/' + this.orgId + '.jpg';

    if (this.bgColorOption[this.orgId]) {
      this.orgThemeBg = this.bgColorOption[this.orgId];
    }
    // Check if type exists in messages, else default
    if (this.lastPage === 'hod') {
      this.header = 'Success!';
      this.msg = 'Your approval has been submitted successfully';
    } else if (this.lastPage === 'draft') {
      this.header = 'Success!';
      this.msg = 'Draft saved successfully.';
    } else if (this.messages[this.lastPage]) {
      this.header = this.messages[this.lastPage].header;
      this.msg = this.messages[this.lastPage].msg;
    } else {
      this.header = 'Thank You!';
      this.msg = 'Your submission has been received successfully.';
    }

    // if (this.lastPage == 'exhibitor' || this.lastPage == 'visitor') {
    //   this.launch();
    // }
  }

  messages: Record<string, { header: string; msg: string }> = {
    1: {
      header: 'Submission Successful!',
      msg: 'Your account relationship request has been recorded successfully.',
    },
    2: {
      header: 'Status Updated Successfully!',
      msg: 'You have successfully updated the registration request status.',
    },
  };

  // private fire(particleRatio: number, opts: Record<string, any>): void {
  //   confetti({
  //     ...this.defaults,
  //     ...opts,
  //     particleCount: Math.floor(this.count * particleRatio),
  //   });
  // }

  // launch(): void {
  //   this.fire(0.25, {
  //     spread: 26,
  //     startVelocity: 55,
  //   });

  //   this.fire(0.2, {
  //     spread: 60,
  //   });

  //   this.fire(0.35, {
  //     spread: 100,
  //     decay: 0.91,
  //     scalar: 0.8,
  //   });

  //   this.fire(0.1, {
  //     spread: 120,
  //     startVelocity: 25,
  //     decay: 0.92,
  //     scalar: 1.2,
  //   });

  //   this.fire(0.1, {
  //     spread: 120,
  //     startVelocity: 45,
  //   });
  // }
}
