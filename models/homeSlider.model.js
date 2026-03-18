import mongoose from 'mongoose';

const homeSliderSchema = mongoose.Schema({
    images: [
        {
            type: String,
            required: true,
        }
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps: true
});

const HomeSliderModel = mongoose.model('HomeSlider',homeSliderSchema)

export default HomeSliderModel;