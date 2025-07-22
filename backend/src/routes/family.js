const express = require('express');
const { auth } = require('../middleware/auth');
const familyController = require('../controllers/familyController');

const router = express.Router();

// All family routes require authentication
router.use(auth);

// Family member management
router.post('/invite', familyController.inviteFamilyMember);
router.get('/members', familyController.getFamilyMembers);
router.get('/pending-invites', familyController.getPendingInvites);
router.post('/accept-invite', familyController.acceptInvite);
router.post('/decline-invite', familyController.declineInvite);
router.put('/relationships/:id/status', familyController.updateRelationshipStatus);
router.delete('/relationships/:id', familyController.removeRelationship);

// Permissions management
router.get('/relationships/:id/permissions', familyController.getPermissions);
router.put('/relationships/:id/permissions', familyController.updatePermissions);

// Caregiver access
router.get('/elderly/:elderlyId/data', familyController.getElderlyData);
router.get('/dashboard', familyController.getCaregiverDashboard);

module.exports = router;
