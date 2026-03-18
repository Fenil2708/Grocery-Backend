import mongoose from 'mongoose';

const bannerSchema = mongoose.Schema({
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
    }
},{
    timestamps: true
});

const BannerModel = mongoose.model('Banner', bannerSchema);

export default BannerModel;
