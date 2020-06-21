import { Request, Response } from "express";
import knex from "../database/connection";

class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    const serializedPoints = points.map((point) => {
      return {
        ...point,
        image_url: `http://192.168.5.22:3333/uploads/${point.image}`,
      };
    });

    return response.json(serializedPoints);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return response.status(400).json({ message: "Point not found." });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.5.22:3333/uploads/${point.image}`,
    };

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.title");

    return response.json({ point: serializedPoint, items });
  }

  async create(request: Request, response: Response) {
    // desestructuring 'request.body' in an object
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = request.body;

    // open a transaction to apply rollback/ commit if something fail
    const trx = await knex.transaction();

    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    // insert into table 'points'
    const insertedIds = await trx("points").insert(point);

    // get the point_id just inserted from table 'points'
    const point_id = insertedIds[0];

    // get the items from 'request.body' and link item_id with point_id
    const pointItems = items
      .split(",")
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id,
        };
      });

    // try to insert item_id and point_id into table 'point_items'
    // if it fails, rollback the inserts on tables 'point_items' and 'points'
    try {
      await trx("point_items").insert(pointItems);
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      return response.status(400).json({
        message:
          "Insert into table point_items failed, please check if all of items are valids",
      });
    }

    // return a response with id of the point created
    return response.json({
      id: point_id,
      ...point,
    });
  }
}

export default PointsController;
