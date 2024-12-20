import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 12,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 4,
  },
  logoContainer: {
    width: 120,
    height: 60,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155',
  },
  infoSection: {
    marginBottom: 15,
    flexDirection: 'column',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    fontSize: 8,
    width: 60,
    color: '#6c757d',
  },
  value: {
    fontSize: 8,
    color: '#2c3e50',
  },
  table: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 3,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    minHeight: 30,
  },
  tableRowEven: {
    backgroundColor: '#f8f9fa',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  headerCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  cell: {
    padding: 6,
    fontSize: 8,
    color: '#212529',
  },
  dateCell: {
    width: '12%',
  },
  timeCell: {
    width: '12%',
  },
  modifiedCell: {
    width: '15%',
  },
  overtimeCell: {
    width: '12%',
  },
  commentCell: {
    width: '17%',
  },
  statusCell: {
    width: '10%',
  },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  totalsLabel: {
    padding: 4,
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  totalsValue: {
    padding: 4,
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureSection: {
    width: '33%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6c757d',
    textAlign: 'center',
  },
  signatureDate: {
    fontSize: 8,
    color: '#6c757d',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    fontSize: 8,
    textAlign: 'center',
    color: '#6c757d',
  },
  signaturePlaceholder: {
    height: 60,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Helper function to safely format date
const safeFormatDate = (dateString) => {
  try {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return '-';
  }
};

// Helper function to safely format time
const safeFormatTime = (timeString) => {
  try {
    if (!timeString) return '-';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'HH:mm');
  } catch (error) {
    return '-';
  }
};

// Helper function to format numbers
const formatNumber = (value) => {
  if (!value) return '-';
  const num = parseFloat(value);
  return isNaN(num) ? '-' : num.toFixed(2);
};

// Helper function to format time duration
const formatDuration = (duration) => {
  if (!duration) return '-';
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const TimesheetPDF = ({ 
  employeeDetails, 
  period, 
  entries, 
  totals, 
  companyLogo, 
  supervisorSignature,
  employeeSignature 
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          {companyLogo && (
            <View style={styles.logoContainer}>
              <Image
                src={companyLogo}
                style={styles.logo}
              />
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Time Sheet</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Employee:</Text>
            <Text style={styles.value}>{`${employeeDetails?.name || ''} ${employeeDetails?.surname || ''}`}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>
              {period?.start || '-'} - {period?.end || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
            <Text style={[styles.headerCell, styles.timeCell]}>Clock In</Text>
            <Text style={[styles.headerCell, styles.timeCell]}>Clock Out</Text>
            <Text style={[styles.headerCell, styles.modifiedCell]}>Approved Hours</Text>
            <Text style={[styles.headerCell, styles.overtimeCell]}>Overtime</Text>
            <Text style={[styles.headerCell, styles.commentCell]}>Comment</Text>
            <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
          </View>

          {entries.map((entry, index) => (
            <View key={index} style={[
              styles.tableRow,
              index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
            ]}>
              <Text style={[styles.cell, styles.dateCell]}>
                {safeFormatDate(entry.date)}
              </Text>
              <Text style={[styles.cell, styles.timeCell]}>
                {safeFormatTime(entry.time_in)}
              </Text>
              <Text style={[styles.cell, styles.timeCell]}>
                {safeFormatTime(entry.time_out)}
              </Text>
              <Text style={[styles.cell, styles.modifiedCell]}>
                {formatNumber(entry.modified_hours)}
              </Text>
              <Text style={[styles.cell, styles.overtimeCell]}>
                {(() => {
                  const modifiedHours = parseFloat(entry.modified_hours) || 0;
                  const overtimeHours = Math.max(0, modifiedHours - 9);
                  return overtimeHours > 0 ? formatNumber(overtimeHours) : '-';
                })()}
              </Text>
              <Text style={[styles.cell, styles.commentCell]}>
                {entry.comment || '-'}
              </Text>
              <Text style={[styles.cell, styles.statusCell]}>
                {entry.status || '-'}
              </Text>
            </View>
          ))}

          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { flex: 1 }]}>Total Approved Hours:</Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}></Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}></Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}></Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}>Regular: {formatNumber(totals.regular_hours)}h</Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}>Overtime: {formatNumber(totals.overtime_hours)}h</Text>
            <Text style={[styles.totalsValue, { flex: 2 }]}></Text>
            <Text style={[styles.totalsValue, { flex: 1 }]}></Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <View>
              {employeeSignature ? (
                <Image
                  src={employeeSignature}
                  style={{
                    width: '100%',
                    height: 60,
                    objectFit: 'contain',
                    marginBottom: 8
                  }}
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Text style={styles.placeholderText}>Employee to sign</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Employee Signature</Text>
            </View>
          </View>
          <View style={styles.signatureSection}>
            {supervisorSignature ? (
              <View>
                <Image
                  src={supervisorSignature}
                  style={{
                    width: '100%',
                    height: 100,
                    objectFit: 'contain',
                    marginBottom: 10,
                    marginTop: -20
                  }}
                />
                <Text style={styles.signatureLabel}>Supervisor Signature</Text>
              </View>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Supervisor Signature</Text>
              </>
            )}
          </View>
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureDate}>{format(new Date(), 'dd/MM/yyyy')}</Text>
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
          `Page ${pageNumber} of ${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
};

export default TimesheetPDF;
