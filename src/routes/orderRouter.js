const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');

const orderRouter = express.Router();

orderRouter.endpoints = [
  { method: 'GET', path: '/api/order/menu', description: 'Get the pizza menu', example: `curl localhost:3000/order/menu` },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -b cookies.txt -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'`,
  },
  { method: 'GET', path: '/api/order', requiresAuth: true, description: 'Get the orders for the authenticated user', example: `curl -b cookies.txt -X GET localhost:3000/api/order` },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -b cookies.txt -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'`,
  },
];

// getMenu
orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to add menu item', 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const orderReq = req.body;
    const order = await DB.addDinerOrder(req.user, orderReq);
    const r = await fetch(`${config.factory.url}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
      body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
    });
    const j = await r.json();
    if (r.ok) {
      res.send({ order, jwt: j.jwt });
    } else {
      throw new StatusCodeError(`Failed to fulfill order at factory. ${JSON.stringify(j)}`, 500);
    }
  })
);

module.exports = orderRouter;
