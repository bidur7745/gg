import React, { useContext, useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddHospital = () => {
    const [hospImg, setHospImg] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState("Government");
    const [address1, setAddress1] = useState("");
    const [address2, setAddress2] = useState("");
    const [description, setDescription] = useState("");

    const { backendUrl, aToken } = useContext(AdminContext);

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        try {
            if (!hospImg) {
                return toast.error("Image Not Selected");
            }

            const formData = new FormData();
            formData.append("image", hospImg);
            formData.append("name", name);
            formData.append("email", email);
            formData.append("phone", phone);
            formData.append("type", type);
            formData.append("address", JSON.stringify({ line1: address1, line2: address2 }));
            formData.append("description", description);

            const { data } = await axios.post(
                backendUrl + "/api/admin/add-hospital",
                formData,
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success(data.message);
                setHospImg(false);
                setName("");
                setEmail("");
                setPhone("");
                setAddress1("");
                setAddress2("");
                setDescription("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="m-5 w-full">
            <p className="mb-3 text-lg font-medium">Add Hospital</p>
            <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
                <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <label htmlFor="hosp-img">
                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
                            <img
                                className="w-full h-full object-cover"
                                src={hospImg ? URL.createObjectURL(hospImg) : assets.upload_area}
                                alt=""
                            />
                        </div>
                    </label>
                    <input
                        onChange={(e) => setHospImg(e.target.files[0])}
                        type="file"
                        id="hosp-img"
                        hidden
                    />
                    <p>
                        Upload hospital <br /> image
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
                    <div className="w-full lg:flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Hospital Name</p>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Name"
                                required
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                            <p>Email</p>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                className="border rounded px-3 py-2"
                                type="email"
                                placeholder="Email"
                                required
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                            <p>Phone</p>
                            <input
                                onChange={(e) => setPhone(e.target.value)}
                                value={phone}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Phone number"
                                required
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                            <p>Type</p>
                            <select
                                onChange={(e) => setType(e.target.value)}
                                value={type}
                                className="border rounded px-3 py-2"
                            >
                                <option value="Government">Government</option>
                                <option value="Private">Private</option>
                                <option value="Community">Community</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full lg:flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Address</p>
                            <input
                                onChange={(e) => setAddress1(e.target.value)}
                                value={address1}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Address line 1"
                                required
                            />
                            <input
                                onChange={(e) => setAddress2(e.target.value)}
                                value={address2}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Address line 2"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="mt-4 mb-2">Description</p>
                    <textarea
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        className="w-full px-4 pt-2 border rounded"
                        placeholder="Write about the hospital"
                        rows={5}
                    />
                </div>

                <button
                    type="submit"
                    className="bg-primary px-10 py-3 mt-4 text-white rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                >
                    Add Hospital
                </button>
            </div>
        </form>
    );
};

export default AddHospital;
