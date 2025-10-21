import Chat from "../models/Chat.js";
import { retrieveTopSections, askGemini } from "../retriverQA/retriever.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = await Chat.db.db.admin().ping();

    res.status(200).json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      database: dbStatus.ok ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server is running but database is not connected",
      error: err.message,
    });
  }
};

// Handle chat request
export const handleChat = async (req, res) => {
  const startTime = Date.now();

  try {
    const { question, language = "en" } = req.body;

    console.log(`📝 New question: "${question}" (Language: ${language})`);

    // Retrieve relevant context from Pinecone
    console.log("🔍 Searching for relevant context...");
    const topSections = await retrieveTopSections(question, 3);

    if (topSections.length === 0) {
      console.warn("⚠️ No relevant context found");
    } else {
      console.log(`✅ Found ${topSections.length} relevant sections`);
    }

    // Generate answer using Gemini
    console.log("🤖 Generating answer with Gemini...");
    const answer = await askGemini(question, topSections, language);

    // Save chat to DB
    const newChat = new Chat({ question, answer, language });
    await newChat.save();
    console.log(`💾 Chat saved to database (ID: ${newChat._id})`);

    const duration = Date.now() - startTime;
    console.log(`✅ Request completed in ${duration}ms`);

    res.status(200).json({
      success: true,
      answer: answer, // Frontend expects 'answer' field directly
      data: {
        question,
        answer,
        chatId: newChat._id,
        timestamp: newChat.createdAt,
        language,
      },
      meta: {
        sectionsFound: topSections.length,
        processingTime: `${duration}ms`,
      },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error after ${duration}ms:`, err.message);
    console.error(err.stack);

    res.status(500).json({
      success: false,
      error: "Failed to process your question. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const total = await Chat.countDocuments();
    const chats = await Chat.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      data: chats,
      meta: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat history",
    });
  }
};

// Helper function to load orders from JSON file
const loadOrders = () => {
  try {
    const ordersPath = path.join(__dirname, "../dummy data/orders.json");
    const ordersData = fs.readFileSync(ordersPath, "utf8");
    return JSON.parse(ordersData);
  } catch (error) {
    console.error("❌ Error loading orders:", error.message);
    return [];
  }
};

// Get all orders endpoint
export const getAllOrders = async (req, res) => {
  try {
    const orders = loadOrders();

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get order by ID endpoint
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = loadOrders();

    const order = orders.find(
      (o) => o.orderId === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching order:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Track order endpoint (using real order data)
export const trackOrder = async (req, res) => {
  try {
    const { orderId, userLat, userLng } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    console.log(`🚚 Tracking order: ${orderId}`);

    // Load orders from JSON file
    const orders = loadOrders();

    // Find the order by ID or order number
    const order = orders.find(
      (o) => o.orderId === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found. Please check your Order ID.",
      });
    }

    console.log(
      `✅ Found order: ${order.orderNumber} - Status: ${order.status}`
    );

    if (userLat && userLng) {
      console.log(`📍 User location: [${userLat}, ${userLng}]`);
    }

    // Get restaurant and customer locations
    const restaurantLat = order.restaurant.address.latitude;
    const restaurantLng = order.restaurant.address.longitude;

    // Use user's real-time location if provided, otherwise use order's delivery address
    const destinationLat = userLat
      ? parseFloat(userLat)
      : order.customer.deliveryAddress.latitude;
    const destinationLng = userLng
      ? parseFloat(userLng)
      : order.customer.deliveryAddress.longitude;

    // Get delivery person location from order data
    let deliveryLat = order.delivery.currentLocation.latitude;
    let deliveryLng = order.delivery.currentLocation.longitude;

    // For live tracking during "on_the_way" stage, add slight movement
    if (order.status === "on_the_way") {
      const randomOffsetLat = (Math.random() - 0.5) * 0.0002;
      const randomOffsetLng = (Math.random() - 0.5) * 0.0002;
      deliveryLat += randomOffsetLat;
      deliveryLng += randomOffsetLng;
    }

    // Fetch road route from OSRM (OpenStreetMap Routing Machine)
    let roadRoute = null;
    try {
      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`
      );
      const routeData = await routeResponse.json();

      if (routeData.code === "Ok" && routeData.routes && routeData.routes[0]) {
        const routeCoords = routeData.routes[0].geometry.coordinates;
        roadRoute = routeCoords.map((coord) => [coord[1], coord[0]]);
        console.log(`🗺️ Road route calculated: ${roadRoute.length} points`);
      }
    } catch (error) {
      console.error("❌ Error fetching road route:", error.message);
      roadRoute = [
        [restaurantLat, restaurantLng],
        [deliveryLat, deliveryLng],
        [destinationLat, destinationLng],
      ];
    }

    // Map timeline stages to frontend format
    const stages = order.timeline.map((stage) => ({
      id:
        stage.stage === "order_placed"
          ? 1
          : stage.stage === "order_preparing"
          ? 2
          : stage.stage === "order_ready"
          ? 3
          : stage.stage === "on_the_way"
          ? 4
          : 5,
      name:
        stage.stage === "order_placed"
          ? "Order Placed"
          : stage.stage === "order_preparing"
          ? "Order being Prepared"
          : stage.stage === "order_ready"
          ? "Order Ready for Delivery"
          : stage.stage === "on_the_way"
          ? "Order is on the Way"
          : "Order Delivered",
      completed: stage.status === "completed",
      timestamp: stage.timestamp,
    }));

    const deliveryData = {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant.name,
      restaurantLocation: order.restaurant.address.area,
      eta: order.currentETA,
      status:
        order.status === "order_placed"
          ? "Order Placed"
          : order.status === "order_preparing"
          ? "Order being Prepared"
          : order.status === "order_ready"
          ? "Order Ready for Delivery"
          : order.status === "on_the_way"
          ? "Order is on the Way"
          : "Order Delivered",
      currentStage: order.currentStage,
      orderPlacedAt: order.createdAt,
      elapsedMinutes: order.elapsedMinutes,
      location: {
        lat: deliveryLat,
        lng: deliveryLng,
      },
      destination: {
        lat: destinationLat,
        lng: destinationLng,
      },
      restaurant: {
        lat: restaurantLat,
        lng: restaurantLng,
        name: order.restaurant.name,
        phone: order.restaurant.phone,
      },
      roadRoute: roadRoute,
      driver: {
        name: order.delivery.driver.name,
        phone: order.delivery.driver.phone,
        vehicle: order.delivery.driver.vehicle.type,
        vehicleNumber: order.delivery.driver.vehicle.number,
        vehicleModel: order.delivery.driver.vehicle.model,
      },
      progress: {
        steps: stages,
      },
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      deliveryInstructions: order.delivery.instructions,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.deliveryAddress,
      },
    };

    console.log(
      `✅ Order tracking data: Stage ${order.currentStage + 1}/5, ETA: ${
        order.currentETA
      } min`
    );

    res.status(200).json({
      success: true,
      data: deliveryData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error tracking order:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to track order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
