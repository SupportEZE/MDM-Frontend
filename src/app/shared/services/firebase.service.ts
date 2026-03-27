import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {

  constructor(
    private firestore: AngularFirestore,
    private database: AngularFireDatabase,
    private auth: AngularFireAuth
  ) {}

  getFirestore() {
    return this.firestore;
  }

  getDatabase() {
    return this.database;
  }

  getAuth() {
    return this.auth;
  }

}
