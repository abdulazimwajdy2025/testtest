// Global variables
let studentsData = [];
let currentStudent = null;

// DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultSection = document.getElementById('result-section');
const resultDiv = document.getElementById('result');
const loadingSpinner = document.getElementById('loading-spinner');
const messageContainer = document.getElementById('message-container');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
async function initializeApp() {
    try {
        await loadStudentsData();
        setupEventListeners();
        setupInputValidation();
        showMessage('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showMessage('خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.', 'error');
    }
}

// Load students data
async function loadStudentsData() {
    try {
        const response = await fetch('students.json');
        if (!response.ok) {
            throw new Error('فشل في تحميل البيانات');
        }
        studentsData = await response.json();
    } catch (error) {
        throw new Error('خطأ في تحميل بيانات الطلاب');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search button click
    searchButton.addEventListener('click', handleSearch);
    
    // Enter key press in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Input formatting
    searchInput.addEventListener('input', formatNationalId);
    
    // Clear results when input is cleared
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            hideResults();
        }
    });
}

// Setup input validation
function setupInputValidation() {
    searchInput.addEventListener('input', function() {
        const value = this.value.replace(/\D/g, ''); // Remove non-digits
        const isValid = value.length === 14;
        
        // Update button state
        searchButton.disabled = !isValid;
        
        // Update input styling
        if (value.length > 0) {
            if (isValid) {
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else {
                this.classList.add('invalid');
                this.classList.remove('valid');
            }
        } else {
            this.classList.remove('invalid', 'valid');
        }
    });
}

// Format national ID input
function formatNationalId(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 14) {
        value = value.substring(0, 14);
    }
    e.target.value = value;
}

// Handle search
async function handleSearch() {
    const nationalId = searchInput.value.trim();
    
    // Validate input
    if (!validateNationalId(nationalId)) {
        showMessage('يرجى إدخال رقم قومي صحيح مكون من 14 رقم', 'error');
        return;
    }
    
    // Show loading
    showLoading();
    
    try {
        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const student = findStudent(nationalId);
        
        if (student) {
            currentStudent = student;
            displayResults(student);
            showMessage('تم العثور على النتيجة بنجاح', 'success');
        } else {
            hideResults();
            showMessage('لم يتم العثور على نتيجة لهذا الرقم القومي', 'warning');
        }
    } catch (error) {
        console.error('خطأ في البحث:', error);
        showMessage('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        hideLoading();
    }
}

// Validate national ID
function validateNationalId(id) {
    return /^\d{14}$/.test(id);
}

// Find student by national ID
function findStudent(nationalId) {
    const id = Number(nationalId);
    return studentsData.find(student => student.id === id);
}

// Display search results
function displayResults(student) {
    const resultHTML = generateResultHTML(student);
    resultDiv.innerHTML = resultHTML;
    
    // Show results section with animation
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Setup result actions
    setupResultActions();
}

// Generate result HTML
function generateResultHTML(student) {
    const grades = calculateGrades(student);
    const gradeRows = generateGradeRows(student, grades);
    
    return `
        <h2>
            <i class="fas fa-trophy"></i>
            مبروك النجاح
        </h2>
        
        <div class="student-info-card">
            <div class="student-header">
                <div class="student-avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="student-details">
                    <h3>${student.name}</h3>
                    <p class="grade-level">${translateGradeLevel(student.gradeLevel)}</p>
                </div>
            </div>
        </div>
        
        <div class="grades-container">
            <h3 class="grades-title">
                <i class="fas fa-chart-bar"></i>
                تفاصيل الدرجات
            </h3>
            
            <table class="result-table">
                <thead>
                    <tr>
                        <th>المادة</th>
                        <th>الدرجة</th>
                        <th>النسبة المئوية</th>
                        <th>التقدير</th>
                    </tr>
                </thead>
                <tbody>
                    ${gradeRows}
                </tbody>
            </table>
            
            <div class="grade-summary">
                <div class="summary-item">
                    <i class="fas fa-calculator"></i>
                    <span>المجموع الكلي: ${grades.total} / ${grades.maxTotal}</span>
                </div>
                <div class="summary-item">
                    <i class="fas fa-percentage"></i>
                    <span>النسبة المئوية: ${grades.percentage}%</span>
                </div>
                <div class="summary-item ${getGradeClass(grades.percentage)}">
                    <i class="fas fa-medal"></i>
                    <span>التقدير العام: ${getGradeText(grades.percentage)}</span>
                </div>
            </div>
            
            ${generateGradeChart(student, grades)}
        </div>
        
        <div class="action-buttons">
            <button class="action-btn btn-print" onclick="printResults()">
                <i class="fas fa-print"></i>
                طباعة النتيجة
            </button>
            <button class="action-btn btn-download" onclick="downloadResults()">
                <i class="fas fa-download"></i>
                تحميل PDF
            </button>
            <button class="action-btn btn-share" onclick="shareResults()">
                <i class="fas fa-share-alt"></i>
                مشاركة النتيجة
            </button>
        </div>
    `;
}

// Calculate grades and statistics
function calculateGrades(student) {
    let total = 0;
    let maxTotal = 0;
    let subjectCount = 0;
    
    const subjects = student.gradeLevel === 'primary 3' 
        ? ['arabic', 'math', 'english']
        : ['arabic', 'math', 'english', 'social', 'scienc'];
    
    subjects.forEach(subject => {
        if (student[subject] && student[subject] !== '_' && student[subject] !== 0) {
            total += Number(student[subject]);
            maxTotal += 100;
            subjectCount++;
        }
    });
    
    const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    
    return {
        total,
        maxTotal,
        percentage,
        subjectCount,
        subjects
    };
}

// Generate grade rows for table
function generateGradeRows(student, grades) {
    const subjects = {
        'arabic': 'لغة عربية',
        'math': 'رياضيات', 
        'english': 'إنجليزي حكومي',
        'social': 'دراسات',
        'scienc': 'علوم',
        'eng': 'مستوى إنجليزي',
        'deen': 'تربية دينية',
        'dis': 'متعدد التخصصات',
        'scal': 'مهارات',
        'ict': 'كمبيوتر',
        'art': 'تربية فنية',
        'mu': 'تربية موسيقية',
        'pe': 'تربية بدنية',
        'tok': 'توكاتسو'
    };
    
    let rows = '';
    
    // Main subjects (counted in total)
    const mainSubjects = student.gradeLevel === 'primary 3' 
        ? ['arabic', 'math', 'english']
        : ['arabic', 'math', 'english', 'social', 'scienc'];
    
    mainSubjects.forEach(subject => {
        const grade = student[subject];
        if (grade && grade !== '_' && grade !== 0) {
            const percentage = Math.round((grade / 100) * 100);
            const gradeClass = getGradeClass(percentage);
            const gradeText = getGradeText(percentage);
            
            rows += `
                <tr class="${gradeClass}">
                    <td><strong>${subjects[subject]}</strong></td>
                    <td><strong>${grade}</strong></td>
                    <td>${percentage}%</td>
                    <td>${gradeText}</td>
                </tr>
            `;
        }
    });
    
    // Additional subjects (not counted in total)
    const additionalSubjects = ['eng', 'deen', 'dis', 'scal', 'ict', 'art', 'mu', 'pe', 'tok'];
    
    additionalSubjects.forEach(subject => {
        const grade = student[subject];
        if (grade && grade !== '_' && grade !== 0) {
            if (subject === 'pe' || subject === 'tok') {
                rows += `
                    <tr>
                        <td>${subjects[subject]}</td>
                        <td colspan="3" class="text-center">${grade}</td>
                    </tr>
                `;
            } else {
                const percentage = Math.round((grade / 100) * 100);
                const gradeClass = getGradeClass(percentage);
                const gradeText = getGradeText(percentage);
                
                rows += `
                    <tr class="${gradeClass}">
                        <td>${subjects[subject]}</td>
                        <td>${grade}</td>
                        <td>${percentage}%</td>
                        <td>${gradeText}</td>
                    </tr>
                `;
            }
        }
    });
    
    return rows;
}

// Generate grade chart
function generateGradeChart(student, grades) {
    const subjects = student.gradeLevel === 'primary 3' 
        ? ['arabic', 'math', 'english']
        : ['arabic', 'math', 'english', 'social', 'scienc'];
    
    const subjectNames = {
        'arabic': 'عربي',
        'math': 'رياضيات', 
        'english': 'إنجليزي',
        'social': 'دراسات',
        'scienc': 'علوم'
    };
    
    let chartHTML = '<div class="grade-chart"><h4>الرسم البياني للدرجات</h4><div class="chart-bars">';
    
    subjects.forEach(subject => {
        const grade = student[subject];
        if (grade && grade !== '_' && grade !== 0) {
            const percentage = (grade / 100) * 100;
            const height = Math.max(percentage, 5); // Minimum height for visibility
            const color = getBarColor(percentage);
            
            chartHTML += `
                <div class="chart-bar">
                    <div class="bar" style="height: ${height}%; background-color: ${color};">
                        <span class="bar-value">${grade}</span>
                    </div>
                    <div class="bar-label">${subjectNames[subject]}</div>
                </div>
            `;
        }
    });
    
    chartHTML += '</div></div>';
    return chartHTML;
}

// Get grade class for styling
function getGradeClass(percentage) {
    if (percentage >= 85) return 'grade-excellent';
    if (percentage >= 65) return 'grade-good';
    return 'grade-average';
}

// Get grade text
function getGradeText(percentage) {
    if (percentage >= 95) return 'ممتاز مرتفع';
    if (percentage >= 85) return 'ممتاز';
    if (percentage >= 75) return 'جيد جداً';
    if (percentage >= 65) return 'جيد';
    if (percentage >= 50) return 'مقبول';
    return 'ضعيف';
}

// Get bar color for chart
function getBarColor(percentage) {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 65) return '#f59e0b';
    return '#ef4444';
}

// Translate grade level
function translateGradeLevel(gradeLevel) {
    const translations = {
        'primary 3': 'الصف الثالث الابتدائي',
        'primary 4': 'الصف الرابع الابتدائي',
        'primary 5': 'الصف الخامس الابتدائي',
        'primary 6': 'الصف السادس الابتدائي'
    };
    return translations[gradeLevel] || gradeLevel;
}

// Setup result actions
function setupResultActions() {
    // Add chart styles if not already added
    if (!document.getElementById('chart-styles')) {
        const chartStyles = document.createElement('style');
        chartStyles.id = 'chart-styles';
        chartStyles.textContent = `
            .student-info-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .student-header {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .student-avatar {
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
            }
            
            .student-details h3 {
                font-size: 1.8rem;
                margin-bottom: 5px;
            }
            
            .grade-level {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .grades-container {
                margin-bottom: 30px;
            }
            
            .grades-title {
                font-size: 1.5rem;
                color: var(--primary-color);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .grade-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
                padding: 20px;
                background: rgba(37, 99, 235, 0.05);
                border-radius: 8px;
            }
            
            .summary-item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                padding: 10px;
                border-radius: 6px;
                background: white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .grade-chart {
                margin-top: 30px;
                padding: 20px;
                background: rgba(248, 250, 252, 0.8);
                border-radius: 12px;
            }
            
            .grade-chart h4 {
                text-align: center;
                margin-bottom: 20px;
                color: var(--primary-color);
                font-size: 1.3rem;
            }
            
            .chart-bars {
                display: flex;
                justify-content: space-around;
                align-items: end;
                height: 200px;
                padding: 20px 0;
                border-bottom: 2px solid #e5e7eb;
                position: relative;
            }
            
            .chart-bar {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
                max-width: 80px;
            }
            
            .bar {
                width: 40px;
                min-height: 10px;
                border-radius: 4px 4px 0 0;
                position: relative;
                transition: all 0.3s ease;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 5px;
            }
            
            .bar:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .bar-value {
                color: white;
                font-weight: bold;
                font-size: 0.9rem;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            .bar-label {
                margin-top: 10px;
                font-size: 0.9rem;
                font-weight: 600;
                text-align: center;
                color: var(--text-primary);
            }
            
            @media (max-width: 768px) {
                .student-header {
                    flex-direction: column;
                    text-align: center;
                }
                
                .grade-summary {
                    grid-template-columns: 1fr;
                }
                
                .chart-bars {
                    height: 150px;
                }
                
                .bar {
                    width: 30px;
                }
                
                .bar-label {
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(chartStyles);
    }
}

// Print results
function printResults() {
    if (!currentStudent) {
        showMessage('لا توجد نتيجة للطباعة', 'warning');
        return;
    }
    
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML(currentStudent);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    showMessage('تم إرسال النتيجة للطباعة', 'success');
}

// Generate print HTML
function generatePrintHTML(student) {
    const grades = calculateGrades(student);
    
    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>نتيجة الطالب - ${student.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .student-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                th { background-color: #f0f0f0; }
                .summary { margin-top: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>مدرسة محمود حمد الرسمية للغات</h1>
                <h2>نتيجة الطالب</h2>
            </div>
            <div class="student-info">
                <p><strong>اسم الطالب:</strong> ${student.name}</p>
                <p><strong>المرحلة:</strong> ${translateGradeLevel(student.gradeLevel)}</p>
                <p><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            ${generatePrintTable(student, grades)}
            <div class="summary">
                <p>المجموع الكلي: ${grades.total} / ${grades.maxTotal}</p>
                <p>النسبة المئوية: ${grades.percentage}%</p>
                <p>التقدير العام: ${getGradeText(grades.percentage)}</p>
            </div>
        </body>
        </html>
    `;
}

// Generate print table
function generatePrintTable(student, grades) {
    const subjects = {
        'arabic': 'لغة عربية',
        'math': 'رياضيات', 
        'english': 'إنجليزي حكومي',
        'social': 'دراسات',
        'scienc': 'علوم',
        'eng': 'مستوى إنجليزي',
        'deen': 'تربية دينية',
        'dis': 'متعدد التخصصات',
        'scal': 'مهارات',
        'ict': 'كمبيوتر',
        'art': 'تربية فنية',
        'mu': 'تربية موسيقية',
        'pe': 'تربية بدنية',
        'tok': 'توكاتسو'
    };
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>المادة</th>
                    <th>الدرجة</th>
                    <th>التقدير</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.keys(subjects).forEach(subject => {
        const grade = student[subject];
        if (grade && grade !== '_' && grade !== 0) {
            if (subject === 'pe' || subject === 'tok') {
                tableHTML += `
                    <tr>
                        <td>${subjects[subject]}</td>
                        <td colspan="2">${grade}</td>
                    </tr>
                `;
            } else {
                const percentage = Math.round((grade / 100) * 100);
                const gradeText = getGradeText(percentage);
                
                tableHTML += `
                    <tr>
                        <td>${subjects[subject]}</td>
                        <td>${grade}</td>
                        <td>${gradeText}</td>
                    </tr>
                `;
            }
        }
    });
    
    tableHTML += '</tbody></table>';
    return tableHTML;
}

// Download results as PDF (placeholder)
function downloadResults() {
    showMessage('ميزة تحميل PDF ستكون متاحة قريباً', 'warning');
}

// Share results (placeholder)
function shareResults() {
    if (navigator.share && currentStudent) {
        navigator.share({
            title: `نتيجة الطالب ${currentStudent.name}`,
            text: `تم الحصول على النتيجة بنجاح`,
            url: window.location.href
        }).then(() => {
            showMessage('تم مشاركة النتيجة بنجاح', 'success');
        }).catch(() => {
            showMessage('فشل في مشاركة النتيجة', 'error');
        });
    } else {
        // Fallback: copy to clipboard
        const text = `نتيجة الطالب ${currentStudent.name} - مدرسة محمود حمد الرسمية للغات`;
        navigator.clipboard.writeText(text).then(() => {
            showMessage('تم نسخ معلومات النتيجة', 'success');
        }).catch(() => {
            showMessage('فشل في نسخ المعلومات', 'error');
        });
    }
}

// Show loading spinner
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    searchButton.disabled = true;
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';
}

// Hide loading spinner
function hideLoading() {
    loadingSpinner.classList.add('hidden');
    searchButton.disabled = false;
    searchButton.innerHTML = '<i class="fas fa-search"></i> <span>بحث بالرقم القومي</span>';
}

// Hide results
function hideResults() {
    resultSection.classList.add('hidden');
    currentStudent = null;
}

// Show message
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    message.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
    `;
    
    messageContainer.appendChild(message);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.style.animation = 'slideOutRight 0.5s ease-out forwards';
            setTimeout(() => {
                message.remove();
            }, 500);
        }
    }, 5000);
}

// Add slide out animation
const slideOutKeyframes = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

// Add the keyframes to the document
if (!document.getElementById('slide-out-styles')) {
    const style = document.createElement('style');
    style.id = 'slide-out-styles';
    style.textContent = slideOutKeyframes;
    document.head.appendChild(style);
}

