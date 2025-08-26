<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Zeptomail configuration
$zeptomailToken = 'Zoho-enczapikey wSsVR60lrhX2W6Z7mDT5c+pumw4EAAyiHRwojlOpuHb/Ha2W/cdokUDLAgKkG6AeQ2RvETdAp+l4zhsDgTtdi9okzAtRDCiF9mqRe1U4J3x17qnvhDzJXmtclRuKK40AwgRrmWhgGs0n+g==';
$salesEmail = 'info@playmorswingsets.com';

// Generate HTML email content
$htmlContent = "
<html>
<body style=\"font-family: Arial, sans-serif; margin: 40px; color: #333;\">
  <h2 style=\"color: #4CAF50;\">New Quote Request - Yard Designer</h2>
  
  <div style=\"background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;\">
    <h3>Customer Information</h3>
    <p><strong>Name:</strong> " . htmlspecialchars($input['first_name']) . " " . htmlspecialchars($input['last_name']) . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($input['email']) . "</p>
    <p><strong>Phone:</strong> " . htmlspecialchars($input['phone_number']) . "</p>
    <p><strong>Zip Code:</strong> " . htmlspecialchars($input['zip_code']) . "</p>";

if (!empty($input['notes'])) {
    $htmlContent .= "<p><strong>Notes:</strong> " . htmlspecialchars($input['notes']) . "</p>";
}

$htmlContent .= "
  </div>
  
  <div style=\"margin: 20px 0;\">
    <h3>Design Preview</h3>
    <img src=\"" . htmlspecialchars($input['design_image']) . "\" style=\"max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;\" alt=\"Playground Design\" />
  </div>
  
  <div style=\"background: #f0f8f0; padding: 20px; border-radius: 8px;\">
    <h3>Parts List</h3>
    " . generatePartsListHTML($input['part_list']) . "
  </div>
  
  <p style=\"color: #666; font-size: 12px; margin-top: 30px;\">
    This quote was generated automatically from the Yard Designer tool at playmorswingsets.com
  </p>
</body>
</html>";

// Generate text version
$textContent = "Quote Request from " . $input['first_name'] . " " . $input['last_name'] . "\n\n";
$textContent .= "Contact Info:\n";
$textContent .= "Email: " . $input['email'] . "\n";
$textContent .= "Phone: " . $input['phone_number'] . "\n";
$textContent .= "Zip Code: " . $input['zip_code'] . "\n\n";

if (!empty($input['notes'])) {
    $textContent .= "Notes: " . $input['notes'] . "\n\n";
}

$textContent .= "Parts List:\n";
foreach ($input['part_list'] as $part) {
    $textContent .= "• " . $part['name'] . "\n";
    if (!empty($part['options'])) {
        foreach ($part['options'] as $option) {
            $textContent .= "  - " . $option . "\n";
        }
    }
    $textContent .= "\n";
}

// Prepare email payload
$emailPayload = [
    'from' => ['address' => 'noreply@playmorswingsets.com'],
    'to' => [[
        'email_address' => [
            'address' => $salesEmail,
            'name' => 'Sales Team'
        ]
    ]],
    'cc' => [[
        'email_address' => [
            'address' => $input['email'],
            'name' => $input['first_name'] . ' ' . $input['last_name']
        ]
    ]],
    'reply_to' => [
        'address' => $input['email'],
        'name' => $input['first_name'] . ' ' . $input['last_name']
    ],
    'subject' => 'Quote Request from ' . $input['first_name'] . ' ' . $input['last_name'] . ' - Yard Designer',
    'htmlbody' => $htmlContent,
    'textbody' => $textContent
];

// Add PDF attachment if provided
if (!empty($input['parts_pdf'])) {
    $emailPayload['attachments'] = [[
        'content' => $input['parts_pdf'],
        'mime_type' => 'application/pdf',
        'name' => 'quote-' . $input['first_name'] . '-' . $input['last_name'] . '-' . time() . '.pdf'
    ]];
}

// Send email via Zeptomail
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.zeptomail.com/v1.1/email',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode($emailPayload),
    CURLOPT_HTTPHEADER => [
        'accept: application/json',
        'authorization: ' . $zeptomailToken,
        'cache-control: no-cache',
        'content-type: application/json',
    ],
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . $err]);
} elseif ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Email API Error', 'response' => $response]);
} else {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
}

function generatePartsListHTML($partList) {
    $html = '<ul style="margin: 10px 0; padding-left: 20px;">';
    foreach ($partList as $part) {
        $html .= '<li style="margin: 8px 0; font-weight: bold;">' . htmlspecialchars($part['name']);
        if (!empty($part['options'])) {
            $html .= '<ul style="margin: 5px 0; padding-left: 20px; font-weight: normal;">';
            foreach ($part['options'] as $option) {
                $html .= '<li style="margin: 3px 0; color: #666;">' . htmlspecialchars($option) . '</li>';
            }
            $html .= '</ul>';
        }
        $html .= '</li>';
    }
    $html .= '</ul>';
    return $html;
}
?>