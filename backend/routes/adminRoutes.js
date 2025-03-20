const express = require("express");
const router = express.Router();
const { User, Order, Product, Bargain } = require("../models");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const path = require("path");
const fs = require("fs");

// Get dashboard statistics
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const pendingDeliveries = await Order.countDocuments({ status: "processing" });
    const pendingBargains = await Bargain.countDocuments({ status: "pending" });

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingDeliveries,
      totalProducts,
      lowStockProducts,
      pendingBargains
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Get recent orders
router.get("/recent-orders", protect, admin, async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(recentOrders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Error fetching recent orders" });
  }
});

// Get orders by status for chart
router.get("/orders-by-status", protect, admin, async (req, res) => {
  try {
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },
    ]);
    res.json(ordersByStatus);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({ message: "Error fetching orders by status" });
  }
});

// Get revenue by month for chart
router.get("/revenue-by-month", protect, admin, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsArr: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: { $arrayElemAt: ["$$monthsArr", "$_id"] },
            },
          },
          revenue: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    res.json(revenueByMonth);
  } catch (error) {
    console.error("Error fetching revenue by month:", error);
    res.status(500).json({ message: "Error fetching revenue by month" });
  }
});

// Get orders by payment method for chart
router.get("/orders-by-payment", protect, admin, async (req, res) => {
  try {
    const ordersByPayment = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $cond: [
              { $eq: ["$_id", ""] },
              "Unknown",
              { $ifNull: ["$_id", "Unknown"] },
            ],
          },
          value: 1,
        },
      },
    ]);
    res.json(ordersByPayment);
  } catch (error) {
    console.error("Error fetching orders by payment method:", error);
    res.status(500).json({ message: "Error fetching orders by payment method" });
  }
});

// Get recent users
router.get("/recent-users", protect, admin, async (req, res) => {
  try {
    const recentUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-password");
    res.json(recentUsers);
  } catch (error) {
    console.error("Error fetching recent users:", error);
    res.status(500).json({ message: "Error fetching recent users" });
  }
});

// Get sales performance comparison
router.get("/sales-performance", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // First day of current month
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    // First day of previous month
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    // First day of next month (end of current month)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    // First day of current month (end of previous month)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    
    // Get current month revenue
    const currentMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    
    // Get previous month revenue
    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    
    const thisMonth = currentMonthRevenue[0]?.total || 0;
    const lastMonth = lastMonthRevenue[0]?.total || 0;
    
    // Calculate percentage change
    let percentageChange = 0;
    if (lastMonth > 0) {
      percentageChange = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    } else if (thisMonth > 0) {
      percentageChange = 100; // If last month was 0 and this month has sales, that's a 100% increase
    }
    
    res.json({
      thisMonth,
      lastMonth,
      percentageChange,
    });
  } catch (error) {
    console.error("Error fetching sales performance:", error);
    res.status(500).json({ message: "Error fetching sales performance" });
  }
});

// Get product categories data
router.get("/product-categories", protect, admin, async (req, res) => {
  try {
    const categoryCounts = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $cond: [
              { $eq: ["$_id", ""] },
              "Uncategorized",
              { $ifNull: ["$_id", "Uncategorized"] },
            ],
          },
          value: 1,
        },
      },
      {
        $sort: { value: -1 },
      },
    ]);
    res.json(categoryCounts);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ message: "Error fetching product categories" });
  }
});

// Mark all notifications as read
router.put("/notifications/mark-all-read", protect, admin, async (req, res) => {
  try {
    // Assuming you have a Notification model
    await require('../models/Notification').updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Error marking notifications as read" });
  }
});

// Get all notifications
router.get("/notifications", protect, admin, async (req, res) => {
  try {
    // Assuming you have a Notification model
    const notifications = await require('../models/Notification').find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Update admin profile
router.put("/profile", protect, admin, upload.single("profilePic"), async (req, res) => {
  console.log("PUT /profile request received");
  console.log("Request body:", req.body);
  console.log("Request user:", req.user);
  console.log("Request file:", req.file);
  
  try {
    const { name, email, phone } = req.body;
    const userId = req.user._id; // Get user ID from authenticated user object.

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Current user data:", {
      id: user._id,
      name: user.name,
      profilePic: user.profilePic
    });

    // Update only if values are provided in the request body.  Prevents accidental overwriting.
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    // Handle profile picture upload
    if (req.file) {
      // If user already has a profile picture, delete the old one
      if (user.profilePic && user.profilePic.includes('/')) {
        const oldFilename = user.profilePic.split('/').pop();
        const oldFilePath = path.join(__dirname, "..", "uploads", oldFilename);
        console.log("Attempting to delete old profile picture:", oldFilePath);
        
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log("Old profile picture deleted successfully");
          } catch (deleteError) {
            console.error("Error deleting old profile picture:", deleteError);
          }
        } else {
          console.log("Old profile picture file not found");
        }
      }
      
      // Set the new profile picture with full URL
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5001';
      user.profilePic = `${baseUrl}/uploads/${req.file.filename}`;
      console.log("New profile picture URL:", user.profilePic);
    }

    const updatedUser = await user.save();

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update profile" });
    }

    console.log("Updated user saved successfully:", {
      id: updatedUser._id,
      name: updatedUser.name,
      profilePic: updatedUser.profilePic
    });

    // Update user in localStorage on client side
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: `Error updating profile: ${error.message}` });
  }
});

// Get revenue analytics
router.get("/revenue", protect, admin, async (req, res) => {
  try {
    console.log("GET /revenue request received");
    const { timeRange } = req.query;
    let startDate = new Date();
    
    // Calculate start date based on time range
    switch (timeRange) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    console.log(`Querying revenue data from ${startDate.toISOString()} to now`);

    // Get total revenue from delivered orders
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log("Total revenue result:", totalRevenue);

    // Get revenue by month
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: "$_id.month" }
            ]
          },
          revenue: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    console.log("Revenue by month:", revenueByMonth);

    // Get revenue by category
    let revenueByCategory = [];
    try {
      revenueByCategory = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startDate }
          }
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        {
          $project: {
            _id: 0,
            category: { $ifNull: ["$_id", "Uncategorized"] },
            revenue: 1
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      console.log("Revenue by category:", revenueByCategory);
    } catch (categoryError) {
      console.error("Error fetching category data:", categoryError);
      // Don't throw an error, just log it and proceed with empty array
    }

    // Calculate revenue growth
    const previousPeriod = new Date(startDate);
    previousPeriod.setMonth(previousPeriod.getMonth() - 1);
    
    const [currentPeriod, lastPeriod] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: previousPeriod, $lt: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    const currentRevenue = currentPeriod[0]?.total || 0;
    const lastRevenue = lastPeriod[0]?.total || 0;
    const revenueGrowth = lastRevenue > 0 
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
      : 0;

    // Return all data in a single response
    const response = {
      totalRevenue: currentRevenue,
      deliveredOrders: totalRevenue[0]?.count || 0,
      averageOrderValue: totalRevenue[0]?.count > 0 
        ? currentRevenue / totalRevenue[0].count 
        : 0,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      revenueByMonth,
      revenueByCategory
    };

    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Generate report
router.post("/reports/generate", protect, admin, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    let reportData;

    switch (type) {
      case "sales":
        reportData = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              customer: "$contactInfo.fullName",
              amount: "$totalAmount",
              status: 1
            }
          }
        ]);
        break;

      case "inventory":
        reportData = await Product.aggregate([
          {
            $project: {
              productId: "$_id",
              name: 1,
              category: 1,
              price: 1,
              stock: 1,
              sold: 1
            }
          }
        ]);
        break;

      case "customer":
        reportData = await User.aggregate([
          {
            $match: { role: "user" }
          },
          {
            $project: {
              userId: "$_id",
              name: 1,
              email: 1,
              phone: 1,
              totalOrders: { $size: "$orders" }
            }
          }
        ]);
        break;

      case "delivery":
        reportData = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              customer: "$contactInfo.fullName",
              address: "$shippingAddress",
              status: 1,
              deliveryDate: { $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" } }
            }
          }
        ]);
        break;

      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    res.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating report" });
  }
});

// Export report
router.post("/reports/export", protect, admin, async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.body;
    
    // Generate the report data
    let reportData;
    switch (type) {
      case "sales":
        reportData = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              customer: "$contactInfo.fullName",
              amount: "$totalAmount",
              status: 1
            }
          }
        ]);
        break;

      case "inventory":
        reportData = await Product.aggregate([
          {
            $project: {
              productId: "$_id",
              name: 1,
              category: 1,
              price: 1,
              stock: 1,
              sold: 1
            }
          }
        ]);
        break;

      case "customer":
        reportData = await User.aggregate([
          {
            $match: { role: "user" }
          },
          {
            $project: {
              userId: "$_id",
              name: 1,
              email: 1,
              phone: 1,
              totalOrders: { $size: "$orders" }
            }
          }
        ]);
        break;

      case "delivery":
        reportData = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              customer: "$contactInfo.fullName",
              address: "$shippingAddress",
              status: 1,
              deliveryDate: { $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" } }
            }
          }
        ]);
        break;

      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    if (format === "pdf") {
      // We'll use a simple approach for PDF generation with HTML content
      // Build HTML content from the report data
      let tableHeaders = '';
      let tableRows = '';
      
      if (reportData.length > 0) {
        // Create table headers
        const headers = Object.keys(reportData[0]);
        tableHeaders = headers.map(header => 
          `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${header}</th>`
        ).join('');
        
        // Create table rows
        tableRows = reportData.map(row => {
          const cells = headers.map(header => 
            `<td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${row[header]}</td>`
          ).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
      }
      
      // Assemble the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
            .report-info { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
          <div class="report-info">
            <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Convert HTML to PDF (this is a placeholder - integrate with an actual HTML-to-PDF library)
      // For simplicity, we're just sending the HTML with appropriate headers
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.html`);
      res.send(htmlContent);
      
    } else if (format === "excel") {
      // Create a simple CSV file for Excel compatibility
      let csvContent = '';
      
      if (reportData.length > 0) {
        // Create headers
        const headers = Object.keys(reportData[0]);
        csvContent += headers.join(',') + '\r\n';
        
        // Create rows
        reportData.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas by wrapping in quotes
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          });
          csvContent += values.join(',') + '\r\n';
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.send(csvContent);
    } else {
      return res.status(400).json({ message: "Invalid export format" });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ message: "Error exporting report" });
  }
});

// Helper function to generate report data
async function generateReportData(type, startDate, endDate) {
  // Implementation similar to the generate report route
  // Return the report data
}

module.exports = router;
