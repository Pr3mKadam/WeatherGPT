import { Router } from 'express';
import { waterContent } from '../data/water.js';
import { climateContent } from '../data/climate.js';
import { sustainabilityContent } from '../data/sustainability.js';

const router = Router();

router.get('/water', (req, res) => res.json(waterContent));
router.get('/climate', (req, res) => res.json(climateContent));
router.get('/sustainability', (req, res) => res.json(sustainabilityContent));

export default router;
