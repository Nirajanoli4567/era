import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [reportData, setReportData] = useState(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API_URL}/api/admin/reports/generate`,
        {
          type: reportType,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        { headers }
      );

      setReportData(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      setError(error.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      if (!dateRange.start || !dateRange.end) {
        setError("Please select both start and end dates");
        setLoading(false);
        return;
      }

      // Show a notification that we're generating the report
      console.log(`Exporting ${reportType} report as ${format}...`);

      const headers = { 
        Authorization: `Bearer ${token}`,
      };

      // For file downloads, we need to use a different approach
      const response = await axios.post(
        `${API_URL}/api/admin/reports/export`,
        {
          type: reportType,
          format,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        { 
          headers, 
          responseType: 'blob' 
        }
      );

      // Get filename from the Content-Disposition header if possible
      let filename = `${reportType}-report.${format === 'pdf' ? 'html' : 'csv'}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (error) {
      console.error("Error exporting report:", error);
      let errorMessage = "Failed to export report";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        errorMessage = `Server error: ${error.response.status}`;
        
        // If the error response is a blob, try to read it
        if (error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              setError(errorData.message || errorMessage);
            } catch (e) {
              setError(errorMessage);
            }
          };
          reader.readAsText(error.response.data);
          return;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request:", error.request);
        errorMessage = "No response from server";
      } else {
        // Something happened in setting up the request
        console.error("Error message:", error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Report Generation
      </Typography>

      {/* Report Configuration */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="sales">Sales Report</MenuItem>
                <MenuItem value="inventory">Inventory Report</MenuItem>
                <MenuItem value="customer">Customer Report</MenuItem>
                <MenuItem value="delivery">Delivery Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
                startIcon={<TableIcon />}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExportReport("pdf")}
                disabled={loading || !reportData}
                startIcon={<PdfIcon />}
              >
                Export as PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExportReport("excel")}
                disabled={loading || !reportData}
                startIcon={<DownloadIcon />}
              >
                Export as Excel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Report Results */}
      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Results
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(reportData[0] || {}).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <TableCell key={cellIndex}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AdminReports; 