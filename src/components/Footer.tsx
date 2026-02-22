const adminLinks = [
    "Dashboard",
    "Dimensions",
    "Personalities",
    "Questions",
    "Events",
    "Bookings",
    "Settings",
];
const supportLinks = [
    "Help Centre",
    "Privacy Policy",
    "Terms of Use",
    "popcolab.ca/",
];
const hours = [
    "Mon - Fri: 9am - 9pm",
    "Sat: 10am - 4pm",
    "Sun: Closed",
];

export default function Footer() {
    return (
        <footer className="bg-[#19464d] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Logo and Description */}
                    <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#ff8de6] to-[#f52e81]">
                                <img
                                    src="https://popcolab-o8tgen0k2-felix-li078s-projects.vercel.app/_next/image?url=%2Flogo%2Flogo-icon.png&w=64&q=75"
                                    alt="Pop CoLab logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-lg font-bold">Pop CoLab</span>
                        </div>
                        <p className="text-white/80 leading-snug text-sm">
                            Rediscover the Power of Play. Building trust one experience at a time.
                        </p>
                    </div>

                    {/* Admin Links */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-md text-[#ff8de6]">Admin</h4>
                        <ul className="space-y-1">
                            {adminLinks.map((link, idx) => (
                                <li key={idx}>
                                    <a
                                        href="#"
                                        className="text-white/80 hover:text-white transition font-medium text-sm"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links with Image */}
                    <div className="space-y-2 flex flex-col md:flex-row md:items-start md:gap-3">
                        {/* Links */}
                        <div className="flex flex-col">
                            <h4 className="font-bold text-md text-[#ff8de6]">Support</h4>
                            <ul className="space-y-1">
                                {supportLinks.map((link, idx) => (
                                    <li key={idx}>
                                        <a
                                            href="#"
                                            className="text-white/80 hover:text-white transition font-medium text-sm"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Image */}
                        <img
                            src="https://static.wixstatic.com/media/0fcc3e_16948e6413794975b6a678976470f884~mv2.png/v1/crop/x_0,y_0,w_300,h_298/fill/w_420,h_417,fp_0.50_0.50,lg_1,q_85,enc_avif,quality_auto/42.png"
                            alt="Pop CoLab Friends"
                            className="w-24 h-24 object-cover rounded-lg mt-2 md:mt-0"
                        />
                    </div>
                </div>

                {/* Where to Find Us Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 py-4 border-t border-white/20 text-sm">
                    {/* Location */}
                    <div className="space-y-1">
                        <h4 className="font-bold text-[#ff8de6]">Location</h4>
                        <p className="text-white/80 leading-snug">
                            84 - 1 Leofard Ave.<br />
                            Winnipeg, MB R3B 0O8<br />
                            Richardson Centre Concourse<br />
                            (Lower Level)
                        </p>
                    </div>

                    {/* Hours */}
                    <div className="space-y-1">
                        <h4 className="font-bold text-[#ff8de6]">Hours</h4>
                        <ul className="text-white/80 space-y-1">
                            {hours.map((hour, idx) => (
                                <li key={idx}>{hour}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1">
                        <h4 className="font-bold text-[#ff8de6]">Contact</h4>
                        <div className="text-white/80 space-y-1">
                            <p>
                                <a href="mailto:hello@popcolab.ca" className="hover:text-white transition">
                                    hello@popcolab.ca
                                </a>
                            </p>
                            <p>
                                <a href="#" className="hover:text-white transition">
                                    @pop.colab
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-white/20 pt-3 flex flex-col md:flex-row justify-between items-center gap-2 text-sm">
                    <p className="text-white/80">
                        © 2024 Pop CoLab. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-white/80 hover:text-white transition">
                            Privacy
                        </a>
                        <a href="#" className="text-white/80 hover:text-white transition">
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}