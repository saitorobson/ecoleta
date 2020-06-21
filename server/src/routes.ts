import express from "express";

import { celebrate, Joi } from "celebrate";

import multer from "multer";
import multerConfig from "./config/multer";

import PointsController from "./controllers/PointsController";
import ItemsController from "./controllers/ItemsController";

const routes = express();

const upload = multer(multerConfig);

const pointsController = new PointsController();
const itemsController = new ItemsController();

/* Method patterns to controllers:
 * index = all records;
 * show = one record;
 * create;
 * update;
 * delete;
 */

// list items
routes.get("/items", itemsController.index);

// list filtered points
routes.get("/points", pointsController.index);

// list a specific point
routes.get("/points/:id", pointsController.show);

// create a point
routes.post(
  "/points",
  upload.single("image"),
  celebrate(
    {
      body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        whatsapp: Joi.number().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        city: Joi.string().required(),
        uf: Joi.string().required().max(2),
        items: Joi.string().required(),
      }),
    },
    { abortEarly: false } //show all of the fields with error
  ),
  pointsController.create
);

export default routes;
