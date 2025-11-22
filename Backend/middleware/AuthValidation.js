const Joi = require("joi");

const signupValidation = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        department: Joi.string().min(2).max(100).required(),
        designation: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(4).max(100).required(),
        role: Joi.string().valid('user', 'admin').optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error: error.details[0].message });
    }
    next();
};

const loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error: error.details[0].message });
    }
    next();
};

const asyncWrapper = (fn) => {
    return async(req, res, next) => {
        try{
            await fn(req, res, next);
        }
        catch(error){
            next(error);
        }
    } 
};

module.exports = {
    signupValidation,
    loginValidation,
    asyncWrapper
};