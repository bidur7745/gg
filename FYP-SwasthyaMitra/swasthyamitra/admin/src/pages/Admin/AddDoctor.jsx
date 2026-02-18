import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddDoctor = () => {
  const [docImg, SetDocImg] = useState(false);
  const [name, SetName] = useState("");
  const [email, SetEmail] = useState("");
  const [password, SetPassword] = useState("");
  const [experience, SetExperience] = useState("1 Year");
  const [fees, SetFees] = useState("");
  const [about, SetAbout] = useState("");
  const [speciality, SetSpeciality] = useState("General physician");
  const [degree, SetDegree] = useState("");
  const [address1, SetAddress1] = useState("");
  const [address2, SetAddress2] = useState("");
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { backendUrl, aToken, hospitals, getAllHospitals } = useContext(AdminContext);

  useEffect(() => {
    getAllHospitals();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHospitalDropdown(false);
      }
    };

    if (showHospitalDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHospitalDropdown]);

  const toggleHospital = (hospitalId) => {
    setSelectedHospitals((prev) =>
      prev.includes(hospitalId)
        ? prev.filter((h) => h !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  const getHospitalName = (hospitalId) => {
    const h = hospitals.find((h) => h._id === hospitalId);
    return h ? h.name : "Unknown";
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (!docImg) {
        return toast.error("Image Not Selected");
      }

      const formData = new FormData();

      formData.append("image", docImg);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", Number(fees));
      formData.append("about", about);
      formData.append("speciality", speciality);
      formData.append("degree", degree);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 })
      );
      formData.append("hospitals", JSON.stringify(selectedHospitals));

      const { data } = await axios.post(
        backendUrl + "/api/admin/add-doctor",
        formData,
        { headers: { aToken } }
      );

      if (data.success) {
        toast.success(data.message);
        SetDocImg(false);
        SetName("");
        SetEmail("");
        SetPassword("");
        SetFees("");
        SetAbout("");
        SetDegree("");
        SetAddress1("");
        SetAddress2("");
        setSelectedHospitals([]);
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
      <p className="mb-3 text-lg font-medium">Add Doctor</p>
      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="doc-img">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-gray-100 cursor-pointer flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
                alt=""
              />
            </div>
          </label>
          <input
            onChange={(e) => SetDocImg(e.target.files[0])}
            type="file"
            id="doc-img"
            hidden
          />
          <p>
            Upload doctor <br /> picture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Name</p>
              <input
                onChange={(e) => SetName(e.target.value)}
                value={name}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Name"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Email</p>
              <input
                onChange={(e) => SetEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Password</p>
              <input
                onChange={(e) => SetPassword(e.target.value)}
                value={password}
                className="border rounded px-3 py-2"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Experience</p>
              <select
                onChange={(e) => SetExperience(e.target.value)}
                value={experience}
                className="border rounded px-3 py-2"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`${i + 1} Year`}>{i + 1} Year</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Fees</p>
              <input
                onChange={(e) => SetFees(e.target.value)}
                value={fees}
                className="border rounded px-3 py-2"
                type="number"
                placeholder="fees"
                required
              />
            </div>
          </div>

          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Speciality</p>
              <select
                onChange={(e) => SetSpeciality(e.target.value)}
                value={speciality}
                className="border rounded px-3 py-2"
              >
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Education</p>
              <input
                onChange={(e) => SetDegree(e.target.value)}
                value={degree}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Education"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => SetAddress1(e.target.value)}
                value={address1}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="address 1"
                required
              />
              <input
                onChange={(e) => SetAddress2(e.target.value)}
                value={address2}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="address 2"
                required
              />
            </div>

            {/* Hospital Multi-Select */}
            <div className="flex-1 flex flex-col gap-1">
              <p>Hospitals <span className="text-xs text-gray-400">(Optional - Select zero or more)</span></p>
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
                  className="border rounded px-3 py-2 min-h-[42px] cursor-pointer flex flex-wrap gap-1 items-center hover:border-primary transition-colors"
                >
                  {selectedHospitals.length === 0 ? (
                    <span className="text-gray-400 text-sm">Select hospitals (optional)...</span>
                  ) : (
                    selectedHospitals.map((hId) => (
                      <span
                        key={hId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        {getHospitalName(hId)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHospital(hId);
                          }}
                          className="hover:text-red-500 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                {showHospitalDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded mt-1 max-h-48 overflow-y-auto z-20 shadow-lg">
                    {hospitals.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No hospitals available. Add hospitals first.</p>
                    ) : (
                      hospitals.map((h) => (
                        <label
                          key={h._id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedHospitals.includes(h._id)}
                            onChange={() => toggleHospital(h._id)}
                            className="accent-primary"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{h.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{h.type}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mt-4 mb-2">About Doctor</p>
          <textarea
            onChange={(e) => SetAbout(e.target.value)}
            value={about}
            className="w-full px-4 pt-2 border rounded"
            placeholder="write about doctor"
            rows={5}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-primary px-10 py-3 mt-4 text-white rounded-full cursor-pointer"
        >
          Add doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;
