import * as responseService from '../services/response.service.js';

export const executeAction = async (req, res) => {
    const { alertId, action, target } = req.body;

    if (!alertId || !action || !target) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: alertId, action, target'
        });
    }

    const result = await responseService.executeResponse(alertId, action, target);

    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
};

export const executeBulkAction = async (req, res) => {
    const { alertIds, action, target } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || !action || !target) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: alertIds (array), action, target'
        });
    }

    const result = await responseService.executeBulkResponse(alertIds, action, target);

    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
};
