import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useFirebaseAuth } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import PDFExportButton from '../components/pdf/PDFExportButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_FILTERS = {
  ALL: 'all',
  PENDING_EMPLOYEE: 'PENDING_EMPLOYEE',
  PENDING_SUPERVISOR: 'PENDING_SUPERVISOR',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const StoredTimesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS.ALL);
  const [users, setUsers] = useState({});
  const { user } = useFirebaseAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('stored-timesheets');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const role = userDoc.data().role || 'user';
          console.log('User role:', role);
          setUserRole(role);
        } else {
          console.log('User doc does not exist, setting role to user');
          setUserRole('user');
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const fetchUsers = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const usersData = {};
    snapshot.docs.forEach(doc => {
      usersData[doc.id] = doc.data();
    });
    setUsers(usersData);
  };

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const timesheetsRef = collection(db, 'timesheets');
      let q;

      if (statusFilter === STATUS_FILTERS.ALL) {
        q = query(timesheetsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          timesheetsRef,
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedTimesheets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTimesheets(fetchedTimesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTimesheets();
  }, [statusFilter]);

  useEffect(() => {
    const fetchLogo = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData?.pdfSettings?.logoBase64) {
            setCompanyLogo(userData.pdfSettings.logoBase64);
          }
        }
      }
    };
    fetchLogo();
  }, [user]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING_EMPLOYEE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_SUPERVISOR':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.toDate) {
        return format(date.toDate(), 'dd/MM/yyyy');
      }
      // Handle ISO string or other date formats
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return 'Invalid Date';
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = users[employeeId];
    if (!employee) return employeeId;
    const displayName = employee.name || '';
    const surname = employee.surname || '';
    return `${displayName} ${surname}`.trim() || employeeId;
  };

  const handleDelete = async (timesheetId) => {
    try {
      await deleteDoc(doc(db, 'timesheets', timesheetId));
      toast.success('Timesheet deleted successfully');
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Failed to delete timesheet');
    }
  };

  const getEmployeeDetails = (timesheet) => {
    const employee = users[timesheet.employeeId];
    return {
      name: employee?.name || '',
      surname: employee?.surname || '',
      fullName: getEmployeeName(timesheet.employeeId)
    };
  };

  const handleViewDetails = (timesheet) => {
    console.log('Timesheet status:', timesheet.status);
    console.log('Current user role:', userRole);
    setSelectedTimesheet({
      ...timesheet,
      employeeDetails: getEmployeeDetails(timesheet)
    });
  };

  const handleApprove = async (id) => {
    try {
      const timesheetRef = doc(db, 'timesheets', id);
      await updateDoc(timesheetRef, {
        status: 'COMPLETED',
        approvedAt: new Date().toISOString()
      });
      toast.success('Timesheet approved successfully');
      fetchTimesheets();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast.error('Failed to approve timesheet');
    }
  };

  const DeleteButton = ({ timesheetId }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the timesheet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(timesheetId)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col min-h-screen">
        <Navbar 
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
        />
        <main className="flex-1">
          <div className="container mx-auto py-6">
            <Card>
              <CardHeader>
                <CardTitle>Stored Timesheets</CardTitle>
                <div className="flex gap-2 mt-4">
                  {Object.entries(STATUS_FILTERS).map(([key, value]) => (
                    <Button
                      key={key}
                      onClick={() => setStatusFilter(value)}
                      variant={statusFilter === value ? "default" : "outline"}
                    >
                      {key.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading...</div>
                ) : selectedTimesheet ? (
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTimesheet(null)}
                      className="mb-4"
                    >
                      Back to List
                    </Button>
                    <div className="w-full h-[80vh]">
                      <PDFExportButton
                        employeeDetails={selectedTimesheet.employeeDetails}
                        period={{
                          start: formatDate(selectedTimesheet.period?.start),
                          end: formatDate(selectedTimesheet.period?.end)
                        }}
                        entries={selectedTimesheet.entries || []}
                        totals={selectedTimesheet.totals || {}}
                        companyLogo={companyLogo}
                        employeeSignature={selectedTimesheet.employeeSignature}
                        showPreview={true}
                      />
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((timesheet) => (
                        <TableRow key={timesheet.id}>
                          <TableCell>{getEmployeeName(timesheet.employeeId)}</TableCell>
                          <TableCell>
                            {formatDate(timesheet.period?.start)} - {formatDate(timesheet.period?.end)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeClass(timesheet.status)}`}>
                              {timesheet.status.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(timesheet.createdAt)}</TableCell>
                          <TableCell>{timesheet.totals?.total_hours?.toFixed(2) || 0}</TableCell>
                          <TableCell className="space-x-2">
                            <Button variant="outline" onClick={() => handleViewDetails(timesheet)}>
                              View Details
                            </Button>
                            {timesheet.status === 'PENDING_SUPERVISOR' && userRole === 'admin' && (
                              <>
                                <Button variant="default" onClick={() => handleApprove(timesheet.id)}>
                                  Approve
                                </Button>
                                <Button variant="destructive">
                                  Reject
                                </Button>
                              </>
                            )}
                            <DeleteButton timesheetId={timesheet.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-6">
          <DialogHeader>
            <DialogTitle>Timesheet Preview</DialogTitle>
          </DialogHeader>
          {selectedTimesheet && (
            <div className="flex flex-col h-[calc(95vh-8rem)]">
              <div className="flex-1 min-h-0">
                <PDFExportButton
                  employeeDetails={selectedTimesheet.employeeDetails}
                  period={{
                    start: formatDate(selectedTimesheet.period?.start),
                    end: formatDate(selectedTimesheet.period?.end)
                  }}
                  entries={selectedTimesheet.entries || []}
                  totals={selectedTimesheet.totals || {}}
                  companyLogo={companyLogo}
                  employeeSignature={selectedTimesheet.employeeSignature}
                  showPreview={true}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-auto">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                {selectedTimesheet.status === 'PENDING_SUPERVISOR' && userRole === 'admin' && (
                  <Button onClick={() => {
                    handleApprove(selectedTimesheet.id);
                    setShowPreview(false);
                  }}>
                    Approve Timesheet
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoredTimesheets; 