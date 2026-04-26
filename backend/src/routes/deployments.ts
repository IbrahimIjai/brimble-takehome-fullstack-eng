import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  createDeployment,
  getDeployment,
  listDeployments,
  getLogs,
  updateDeployment,
} from "../db/db";