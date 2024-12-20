import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';

export const TimesheetStatus = {
  DRAFT: 'draft',
  PENDING_EMPLOYEE: 'pending_employee',
  PENDING_SUPERVISOR: 'pending_supervisor',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

class TimesheetStorage {
  constructor() {
    this.db = getFirestore();
    this.timesheetsRef = collection(this.db, 'timesheets');
  }

  /**
   * Store a new timesheet or update existing one
   */
  async storeTimesheet(timesheetData) {
    const {
      employeeId,
      period,
      entries,
      totals,
      status = TimesheetStatus.DRAFT
    } = timesheetData;

    const timesheetId = `${employeeId}_${period.start}_${period.end}`;
    
    const timesheet = {
      id: timesheetId,
      employeeId,
      period,
      entries,
      totals,
      status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      employeeSignature: null,
      supervisorSignature: null,
      employeeSignedAt: null,
      supervisorSignedAt: null,
      rejectionReason: null
    };

    await setDoc(doc(this.timesheetsRef, timesheetId), timesheet);
    return timesheetId;
  }

  /**
   * Get timesheet by ID
   */
  async getTimesheet(timesheetId) {
    const docRef = doc(this.timesheetsRef, timesheetId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  /**
   * Get all timesheets for an employee
   */
  async getEmployeeTimesheets(employeeId, status = null) {
    let q = query(this.timesheetsRef, where('employeeId', '==', employeeId));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  /**
   * Update timesheet status
   */
  async updateStatus(timesheetId, status, reason = null) {
    const docRef = doc(this.timesheetsRef, timesheetId);
    const updates = {
      status,
      updatedAt: Timestamp.now()
    };

    if (reason) {
      updates.rejectionReason = reason;
    }

    await updateDoc(docRef, updates);
  }

  /**
   * Store employee signature
   */
  async storeEmployeeSignature(timesheetId, signatureData) {
    const docRef = doc(this.timesheetsRef, timesheetId);
    await updateDoc(docRef, {
      employeeSignature: signatureData,
      employeeSignedAt: Timestamp.now(),
      status: TimesheetStatus.PENDING_SUPERVISOR,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Store supervisor signature
   */
  async storeSupervisorSignature(timesheetId, signatureData) {
    const docRef = doc(this.timesheetsRef, timesheetId);
    await updateDoc(docRef, {
      supervisorSignature: signatureData,
      supervisorSignedAt: Timestamp.now(),
      status: TimesheetStatus.COMPLETED,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Get pending timesheets for employee signature
   */
  async getPendingEmployeeSignatures(employeeId) {
    const q = query(
      this.timesheetsRef,
      where('employeeId', '==', employeeId),
      where('status', '==', TimesheetStatus.PENDING_EMPLOYEE)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  /**
   * Get pending timesheets for supervisor signature
   */
  async getPendingSupervisorSignatures() {
    const q = query(
      this.timesheetsRef,
      where('status', '==', TimesheetStatus.PENDING_SUPERVISOR)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
}

export const timesheetStorage = new TimesheetStorage();

// Add the missing default export
export default TimesheetStorage;
