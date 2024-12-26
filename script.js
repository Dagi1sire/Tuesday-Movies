document.addEventListener('DOMContentLoaded', () => {
    const addMovieButton = document.getElementById('addMovieButton');
    const addMovieModal = document.getElementById('addMovieModal');
    const confirmAddMovieButton = document.getElementById('confirmAddMovie');
    const cancelAddMovieButton = document.getElementById('cancelAddMovie');
    const movieTitleInput = document.getElementById('movieTitle');
    const movieGenreSelect = document.getElementById('movieGenre');
    const movieImageURLInput = document.getElementById('movieImageURL');
    const movieRatingInput = document.getElementById('movieRating');
    const movieCollection = document.getElementById('movieCollection');
    const movieTimeline = document.getElementById('movieTimeline');
    const totalMoviesCounter = document.getElementById('totalMovies');
    const totalGenresCounter = document.getElementById('totalGenres');
    const consecutiveTuesdaysCounter = document.getElementById('consecutiveTuesdays');
    const backToTopButton = document.getElementById('backToTop');
    const imageUploadInput = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const dropArea = document.getElementById('dropArea');
    const searchInput = document.getElementById('searchInput');
    const todayCheckbox = document.getElementById('todayCheckbox');
    const movieDateInput = document.getElementById('movieDate');
    const latestMoviesButton = document.getElementById('latestMoviesButton');
    const viewStatsButton = document.getElementById('viewStatsButton');

    let movieData = [];

    // Load movie data from localStorage on page load
    loadMovieData();
    updateStats();
    renderMovieCollection();
    renderMovieTimeline();

    // Show the Add Movie modal
    addMovieButton.addEventListener('click', () => {
        addMovieModal.classList.remove('hidden');
        resetModalFields();
    });

    // Hide the Add Movie modal
    function closeModal() {
        addMovieModal.classList.add('hidden');
    }

    cancelAddMovieButton.addEventListener('click', closeModal);

    // Handle image upload
    imageUploadInput.addEventListener('change', handleImageUpload);

    // Handle image URL input
    movieImageURLInput.addEventListener('input', () => {
        const imageUrl = movieImageURLInput.value.trim();
        if (imageUrl) {
            // Check if the URL is valid
            const isValidUrl = isValidImageURL(imageUrl);
            if (isValidUrl) {
                imagePreview.src = imageUrl;
                imagePreview.style.display = 'block';
                resetImageUpload(); // Clear file input if URL is entered
            } else {
                // Optionally show an error or clear the preview if the URL is invalid
                imagePreview.style.display = 'none';
            }
        } else {
            imagePreview.style.display = 'none';
        }
    });

    function isValidImageURL(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Handle rating selection
    const ratingStars = document.querySelectorAll('.rating-stars i');
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.dataset.rating;
            movieRatingInput.value = rating;
            highlightStars(rating);
        });
    });

    function highlightStars(rating) {
        ratingStars.forEach(star => {
            star.classList.toggle('text-yellow-500', star.dataset.rating <= rating);
            star.classList.toggle('text-gray-400', star.dataset.rating > rating);
        });
    }

    // Handle adding a new movie
    confirmAddMovieButton.addEventListener('click', async () => {
        const title = movieTitleInput.value.trim();
        const genre = movieGenreSelect.value;
        const imageSrc = await getMovieImageSrc();
        const rating = parseInt(movieRatingInput.value);
        const date = movieDateInput.value;

        if (!title || !imageSrc || !rating || !date) {
            alert('Please fill in all fields.');
            return;
        }

        const newMovie = { title, genre, imageSrc, rating, date };
        addMovie(newMovie);
        closeModal();
    });

    async function getMovieImageSrc() {
        if (imagePreview.src && imagePreview.src !== window.location.href + '#') {
            return imagePreview.src;
        } else if (movieImageURLInput.value.trim()) {
            return movieImageURLInput.value.trim();
        }
        return '';
    }

    //Date Watched Logic
    todayCheckbox.addEventListener('change', () => {
        if (todayCheckbox.checked) {
            movieDateInput.value = new Date().toISOString().substring(0, 10); // Set to today's date
            movieDateInput.disabled = true;
        } else {
            movieDateInput.value = ''; // Clear the date
            movieDateInput.disabled = false;
        }
    });

    function addMovie(newMovie) {
        movieData.push(newMovie);
        saveMovieData();
        updateStats();
        renderMovieCollection();
        renderMovieTimeline();
    }

    // Handle image upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                movieImageURLInput.value = ''; // Clear URL input if a file is uploaded
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid image file (max 10MB).');
            resetImageUpload();
        }
    }

    function resetImageUpload() {
        imageUploadInput.value = '';
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
    }

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            // Handle only the first file
            handleImageUpload({ target: { files: [files[0]] } });
        }
    }

    dropArea.addEventListener('click', () => {
        imageUploadInput.click();
    });

    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filteredMovies = movieData.filter(movie => movie.title.toLowerCase().includes(searchTerm));
        renderMovieCollection(filteredMovies);
    });

    // Render movie collection
    function renderMovieCollection(movies = movieData) {
        movieCollection.innerHTML = '';
        movies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            movieCollection.appendChild(movieCard);
        });
    }

    // Create a movie card element
    function createMovieCard(movie) {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card', 'group', 'relative'); // Add 'relative' for positioning the details
        movieCard.innerHTML = `
            <img src="${movie.imageSrc}" alt="${movie.title}" class="w-full h-auto rounded-lg transition-transform group-hover:scale-105">
            <div class="mt-4 movie-details absolute bottom-0 left-0 w-full bg-black/75 text-white p-4 rounded-b-lg">
                <h3 class="text-lg font-semibold">${movie.title}</h3>
                <p class="text-gray-400">Watched: ${movie.date}</p>
                <div class="flex items-center mt-2 rating-stars">
                    ${Array.from({ length: 5 }, (_, i) => `<i class="fas fa-star ${i < movie.rating ? 'text-yellow-500' : 'text-gray-400'}"></i>`).join('')}
                </div>
                <button class="remove-movie-button mt-2 px-3 py-1 rounded-md text-sm bg-red-600 hover:bg-red-700">Remove</button>
            </div>
        `;

        // Add event listener to the remove button
        const removeButton = movieCard.querySelector('.remove-movie-button');
        removeButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to remove "${movie.title}"?`)) {
                removeMovie(movie.title); // Call a function to remove the movie
            }
        });

        return movieCard;
    }

    // Remove a movie from the collection
    function removeMovie(title) {
        movieData = movieData.filter(movie => movie.title !== title);
        saveMovieData();
        renderMovieCollection();
        renderMovieTimeline();
        updateStats();
    }

    // Render movie timeline
    function renderMovieTimeline() {
        movieTimeline.innerHTML = '';
        movieData.forEach(movie => {
            const timelineItem = createTimelineItem(movie);
            movieTimeline.appendChild(timelineItem);
        });
    }

    // Create a timeline item element
    function createTimelineItem(movie) {
        const timelineItem = document.createElement('div');
        timelineItem.classList.add('timeline-item');
        timelineItem.innerHTML = `
            <div class="w-32 h-48 bg-gray-800 rounded-lg overflow-hidden">
                <img src="${movie.imageSrc}" alt="${movie.title}" class="w-full h-full object-cover">
            </div>
            <p class="mt-2 text-center text-sm text-gray-400">${movie.date}</p>
        `;
        return timelineItem;
    }

    // Update stats
    function updateStats() {
        totalMoviesCounter.textContent = movieData.length;
        const uniqueGenres = new Set(movieData.map(movie => movie.genre));
        totalGenresCounter.textContent = uniqueGenres.size;

        // Simple consecutive Tuesdays logic (update as needed)
        const consecutiveTuesdays = calculateConsecutiveTuesdays();
        consecutiveTuesdaysCounter.textContent = consecutiveTuesdays;
    }

    // Function to calculate consecutive Tuesdays
function calculateConsecutiveTuesdays() {
    if (movieData.length === 0) {
        return 0; // No movies added yet
    }

    // Sort movies by date (most recent first)
    const sortedMovies = movieData.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    let consecutiveCount = 0;
    let currentDate = new Date(); // Start with today's date
    let foundFirstTuesday = false;

    // Iterate through the sorted movies
    for (const movie of sortedMovies) {
        const movieDate = new Date(movie.date);

        // Check if the movie was watched on a Tuesday
        if (movieDate.getDay() === 2) { // 2 represents Tuesday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
            // Check for consecutive weeks
            if (!foundFirstTuesday) {
                // First Tuesday found
                foundFirstTuesday = true;
                consecutiveCount = 1;
                currentDate = new Date(movieDate); // Set the first Tuesday as the reference date
            } else {
                const daysDifference = (currentDate - movieDate) / (1000 * 60 * 60 * 24); // Difference in days
                if (daysDifference === 7) {
                    // Movie was watched exactly 7 days before the current date (consecutive Tuesday)
                    consecutiveCount++;
                    currentDate = new Date(movieDate); // Update current date
                } else if (daysDifference > 7) {
                    // There's a gap of more than 7 days, so consecutive streak is broken
                    break;
                }
            }
        }
    }

    return consecutiveCount;
}

    // Reset modal fields
    function resetModalFields() {
        movieTitleInput.value = '';
        movieGenreSelect.value = '';
        movieImageURLInput.value = '';
        movieRatingInput.value = '0';
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
        resetImageUpload();
        highlightStars(0);
        todayCheckbox.checked = false; // Reset the checkbox
        movieDateInput.value = '';      // Clear the date input
        movieDateInput.disabled = false; // Enable the date input
    }

    // Save movie data to localStorage
    function saveMovieData() {
        localStorage.setItem('movieData', JSON.stringify(movieData));
    }

    // Load movie data from localStorage
    function loadMovieData() {
        const storedMovieData = localStorage.getItem('movieData');
        if (storedMovieData) {
            movieData = JSON.parse(storedMovieData);
        }
    }

    // Back to top button functionality
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.remove('opacity-0', 'invisible');
            backToTopButton.classList.add('opacity-100', 'visible');
        } else {
            backToTopButton.classList.remove('opacity-100', 'visible');
            backToTopButton.classList.add('opacity-0', 'invisible');
        }
    });

    // Add event listeners to the buttons
    latestMoviesButton.addEventListener('click', () => {
        // Action to perform when "Latest Movies" button is clicked
        // Example: Scroll to the movie collection section
        const movieCollectionSection = document.getElementById('movieCollection');
        movieCollectionSection.scrollIntoView({ behavior: 'smooth' });
    });

    viewStatsButton.addEventListener('click', () => {
        // Action to perform when "View Stats" button is clicked
        // Example: Scroll to the quick stats section
        const quickStatsSection = document.getElementById('totalMovies').closest('section');
        quickStatsSection.scrollIntoView({ behavior: 'smooth' });
    });
});