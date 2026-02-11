const MockData = [
    // BANQUET
    {
        id: 1,
        key: "banquet",
        name: "Grand Taj Banquet",
        category: "banquet",
        location: "Millium Road, Shahrah e Faisal",
        about: "Elegant banquet hall with modern amenities, perfect for weddings and corporate events. Full catering services available.",
        price: 250000,
        images: [
            "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_vXYwCKqiJgnUhyg3HYqUJbp37TJvL-vD3Z9KK33cqMYRcvcAIakZmpNVfYlZZOr_vhIlZnrUrMJC3ynC1m3AV3mJ7ItlOPvFzSOfqPAtJZ56YegA=w1200-h630-p-k-no-nu",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNda9SZWtNi4FlAy7GatC744UXOivyb3ojAA&s",
            "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_vXYwCKqiJgnUhyg3HYqUJbp37TJvL-vD3Z9KK33cqMYRcvcAIakZmpNVfYlZZOr_vhIlZnrUrMJC3ynC1m3AV3mJ7ItlOPvFzSOfqPAtJZ56YegA=w1200-h630-p-k-no-nu"
        ],
        minGuests: 200,
        maxGuests: 500,
        rating: 4.5
    },
    // CATERING
    {
        id: 2,
        key: "catering",
        name: "Karachi Foods",
        category: "catering",
        location: "Garden West",
        about: "Premium catering service offering authentic Pakistani and Continental cuisine for all occasions.",
        images: [
            "https://evento.com.pk/wp-content/uploads/2016/12/pakistani-wedding-food-presentation-ideas-20.jpg",
            "https://grazers.pk/wp-content/uploads/2025/06/Blog-Stock-Images-26-convert.io_.webp",
            "https://evento.com.pk/wp-content/uploads/2016/12/pakistani-wedding-food-presentation-ideas-20.jpg"
        ],
        packages: [
            {
                id: 1,
                packageName: "Silver Menu",
                price: 120000,
                pricePerHead: 1200,
                guestCount: 200,
                mainCourse: ["Chicken Biryani", "Chicken Tikka", "Chicken Karhai"],
                desserts: ["Ice Cream", "Halwa Sujji"],
                drinks: ["Cold Drink", "Mango Lassi"]
            },
            {
                id: 2,
                packageName: "Gold Menu",
                price: 150000,
                pricePerHead: 1500,
                guestCount: 200,
                mainCourse: ["Chicken Biryani", "Beef Karhai", "Chicken Tikka", "Fish Fry"],
                desserts: ["Ice Cream", "Halwa Sujji", "Kheer"],
                drinks: ["Cold Drink", "Mango Lassi", "Water"]
            }
        ],
        rating: 4.8
    },
    // PHOTOGRAPHER
    {
        id: 3,
        key: "photo",
        name: "Pixel Perfect Studio",
        category: "photo",
        location: "DHA, Phase 6",
        about: "Professional wedding and event photography with latest camera technology and creative editing.",
        images: [
            "https://www.happywedding.app/blog/wp-content/uploads/2024/10/Top-Wedding-Photography-Services.jpg",
            "https://www.happywedding.app/blog/wp-content/uploads/2024/10/Top-Wedding-Photography-Services.jpg",
            "https://www.happywedding.app/blog/wp-content/uploads/2024/10/Top-Wedding-Photography-Services.jpg"
        ],
        packages: [
            {
                id: 1,
                packageName: "Basic Package",
                price: 50000,
                items: ["8 Hours Coverage", "2 Photographers", "1500+ Digital Photos", "Online Album"]
            },
            {
                id: 2,
                packageName: "Premium Package",
                price: 80000,
                items: ["12 Hours Coverage", "3 Photographers", "3000+ Digital Photos", "Online Album", "Video Highlights", "30 Prints"]
            }
        ],
        rating: 4.0
    },
    // PARLOR
    {
        id: 4,
        key: "parlor",
        name: "Glamour Salon",
        category: "parlor",
        location: "Gulshan Iqbal",
        about: "High-end bridal salon offering makeup, hair styling, and complete bridal services.",
        images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP2Xm_adwQ_RFZOjttoZQpOJvDQD5zYrngYk9iqHPNpQ&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP2Xm_adwQ_RFZOjttoZQpOJvDQD5zYrngYk9iqHPNpQ&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP2Xm_adwQ_RFZOjttoZQpOJvDQD5zYrngYk9iqHPNpQ&s"
        ],
        packages: [
            {
                id: 1,
                packageName: "Bridal Makeup",
                price: 25000,
                items: ["Professional Makeup", "Hair Styling", "Trial Session", "Touch-ups on Event Day"]
            },
            {
                id: 2,
                packageName: "Full Bridal Package",
                price: 45000,
                items: ["Professional Makeup", "Advance Hair Styling", "Nail Art", "2 Trial Sessions", "Touch-ups on Event Day", "Engagement Look"]
            }
        ],
        rating: 4.4
    }
]

export default MockData