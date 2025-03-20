const express = require("express");
const router = express.Router();
const { User, Order, Product } = require("../models");
const { protect, admin } = require("../middleware/authMiddleware");

// Get dashboard statistics
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await Order.countDocuments();
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

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingDeliveries,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Get recent orders
router.get("/recent-orders", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Error fetching recent orders" });
  }
});

// Get orders by status
router.get("/orders-by-status", protect, admin, async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          name: { $toUpper: "$_id" },
          value: 1,
          _id: 0,
        },
      },
    ]);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({ message: "Error fetching orders by status" });
  }
});

// Get revenue by month
router.get("/revenue-by-month", protect, admin, async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: "$_id.month" },
            ],
          },
          revenue: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);
    res.json(revenue);
  } catch (error) {
    console.error("Error fetching revenue by month:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Get orders by payment method
router.get("/orders-by-payment", protect, admin, async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          name: { $toUpper: "$_id" },
          value: 1,
          _id: 0,
        },
      },
    ]);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by payment:", error);
    res.status(500).json({ message: "Error fetching payment method data" });
  }
});

// Update admin profile
router.put("/profile", protect, admin, async (req, res) => {
  console.log("PUT /profile request received");
  console.log("Request body:", req.body);
  console.log("Request user:", req.user);
  try {
    const { name, email, phone } = req.body;
    const userId = req.user._id; // Get user ID from authenticated user object.

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only if values are provided in the request body.  Prevents accidental overwriting.
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    const updatedUser = await user.save();

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update profile" });
    }

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
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

    // Get revenue by category
    const revenueByCategory = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.category",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          revenue: 1
        }
      }
    ]);

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

    res.json({
      totalRevenue: currentRevenue,
      deliveredOrders: totalRevenue[0]?.count || 0,
      averageOrderValue: totalRevenue[0]?.count > 0 
        ? currentRevenue / totalRevenue[0].count 
        : 0,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      revenueByMonth,
      revenueByCategory
    });
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
    
    // Generate report data
    const reportData = await generateReportData(type, startDate, endDate);
    
    if (format === "pdf") {
      // Generate PDF using a PDF library (e.g., PDFKit)
      // This is a placeholder - you'll need to implement actual PDF generation
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-report.pdf`);
      // Send PDF data
    } else if (format === "excel") {
      // Generate Excel using a library (e.g., ExcelJS)
      // This is a placeholder - you'll need to implement actual Excel generation
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-report.xlsx`);
      // Send Excel data
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
