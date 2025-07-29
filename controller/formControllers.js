const UserForm = require('../models/UserForm');

const submitForm = async (req, res) => {
  try {
    let {
      firstName, lastName, email, phone,
      dateOfBirth, address, city, state,
      pincode, aadharNumber, agreeTerms, agreeMarketing, courseName
    } = req.body;

    // Fix courseName if it's an array - take the first non-empty value
    if (Array.isArray(courseName)) {
      const validCourseNames = courseName.filter(name => name && name.trim() !== '');
      courseName = validCourseNames.length > 0 ? validCourseNames[0] : '';
      console.log('courseName was an array, converted to:', courseName);
    }

    // Also handle courseAmount if it might be an array
    // if (Array.isArray(courseAmount)) {
    //   const validAmounts = courseAmount.filter(amount => amount && amount.toString().trim() !== '');
    //   courseAmount = validAmounts.length > 0 ? validAmounts[0] : '';
    //   console.log('courseAmount was an array, converted to:', courseAmount);
    // }

    const aadharFile = req.files?.aadharFile?.[0]?.path || null;
    const signatureFile = req.files?.signatureFile?.[0]?.path || null;

    if (!firstName || !lastName || !email || !aadharFile || !signatureFile) {
      return res.status(400).json({ message: 'Missing required fields or files.' });
    }

    const newUser = new UserForm({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      pincode,
      aadharNumber,
      aadharFile,
      signatureFile,
      agreeTerms: agreeTerms === 'true',
      agreeMarketing: agreeMarketing === 'true',
      courseName, 
    
    });

    await newUser.save();
    res.status(201).json({ message: 'Form submitted successfully!' });

  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.aadharNumber) {
        return res.status(409).json({ message: 'Aadhar number already exists. Please check and try again.' });
      } else if (error.keyPattern?.email) {
        return res.status(409).json({ message: 'Email already registered. Please use a different email.' });
      } else if (error.keyPattern?.phone) {
        return res.status(409).json({ message: 'Phone number already registered. Please use a different number.' });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: `Invalid data format for ${error.path}: ${error.message}` 
      });
    }

    console.error('Server Error:', error);
    return res.status(500).json({ message: 'Server error occurred. Please try again later.' });
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await UserForm.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Error fetching registrations', error });
  }
};

module.exports = {
  submitForm,
  getAllRegistrations
};